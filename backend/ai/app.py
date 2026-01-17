from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import os

app = Flask(__name__)
CORS(app)  


def generate_ai_explanation(score, reasons):
    """Generate template-based AI explanation for risk scores"""
    if score >= 70:
        severity = "high-risk"
        action = "immediate audit"
        description = "This transaction exhibits multiple red flags and deviates significantly from normal patterns."
    elif score >= 40:
        severity = "medium-risk"
        action = "detailed review"
        description = "This transaction shows some concerning patterns that warrant closer examination."
    else:
        severity = "low-risk"
        action = "routine monitoring"
        description = "This transaction appears normal but is still being monitored for irregularities."
    
    explanation = f"This transaction is classified as {severity} (Score: {score}/100). "
    
    if reasons and len(reasons) > 0:
        explanation += description + " Key concerns include: "
        explanation += "; ".join(reasons[:3])  # Top 3 reasons
        explanation += f". Recommendation: {action}."
    else:
        explanation += f"No specific risk factors detected. Recommendation: {action}."
    
    return explanation


def generate_department_recommendation(dept_name, anomaly_rate, high_risk_count, total_transactions, top_vendors):
    """Generate actionable recommendations for departments"""
    if anomaly_rate >= 30:
        priority = "HIGH PRIORITY"
        action = f"Immediate comprehensive audit recommended for {dept_name}"
    elif anomaly_rate >= 15:
        priority = "MEDIUM PRIORITY"
        action = f"Scheduled review recommended for {dept_name}"
    else:
        priority = "LOW PRIORITY"
        action = f"Continue routine monitoring for {dept_name}"
    
    recommendation = f"[{priority}] {action}. "
    recommendation += f"Department shows {anomaly_rate:.1f}% anomaly rate ({high_risk_count} out of {total_transactions} transactions flagged). "
    
    if len(top_vendors) > 0:
        top_vendor = top_vendors.iloc[0]
        recommendation += f"Focus investigation on Vendor {top_vendor['vendor_id']} with average risk score of {top_vendor['avgRiskScore']:.1f}. "
    
    if anomaly_rate >= 20:
        recommendation += f"Estimated potential leakage could be significant. Prioritize this department in next audit cycle."
    
    return recommendation


@app.route('/analyze', methods=["POST"])
def analyze():
    try:
        payload = request.get_json()

        if not payload or 'transactions' not in payload:
            return jsonify({"error": "Invalid payload: 'transactions' field required"}), 400

        dataset_id = payload.get('datasetId', 'unknown')
        transactions = payload.get('transactions', [])

        if not transactions:
            return jsonify({
                "datasetId": dataset_id,
                "results": []
            }), 200

        df = pd.DataFrame(transactions)

        df['amount'] = pd.to_numeric(df['amount'], errors='coerce').fillna(0)
        df['transaction_date'] = pd.to_datetime(
            df['transaction_date'], errors='coerce')
        df['isMonthEnd'] = df['isMonthEnd'].astype(bool)
        df['month'] = pd.to_numeric(
            df['month'], errors='coerce').fillna(0).astype(int)

    except Exception as e:
        return jsonify({"error": f"Failed to parse request: {str(e)}"}), 400

    dept_stats = df.groupby('department')['amount'].agg(
        dept_mean='mean',
        dept_std='std'
    ).reset_index()

    # Fill NaN std (occurs when department has only 1 transaction) with 0
    dept_stats['dept_std'] = dept_stats['dept_std'].fillna(0)

    # Vendor frequency per department: count of transactions per vendor within each department
    vendor_dept_freq = df.groupby(['department', 'vendor_id']).size(
    ).reset_index(name='vendor_dept_count')

    # Merge department stats back into main DataFrame
    df = df.merge(dept_stats, on='department', how='left')

    # Merge vendor frequency back into main DataFrame
    df = df.merge(vendor_dept_freq, on=['department', 'vendor_id'], how='left')

    # Initialize risk score and reasons columns
    df['riskScore'] = 0
    df['reasons'] = [[] for _ in range(len(df))]

    rule1_mask = df['amount'] > (2 * df['dept_mean'])
    df.loc[rule1_mask, 'riskScore'] += 30

    rule2_mask = df['vendor_dept_count'] > 3
    df.loc[rule2_mask, 'riskScore'] += 20

    rule3_mask = df['isMonthEnd'] == True
    df.loc[rule3_mask, 'riskScore'] += 15

    rule4_mask = df['amount'] > (df['dept_mean'] + 2 * df['dept_std'])
    df.loc[rule4_mask, 'riskScore'] += 25

    df['riskScore'] = df['riskScore'].clip(upper=100)

    reasons_list = []
    for idx in range(len(df)):
        reasons = []
        if rule1_mask.iloc[idx]:
            reasons.append(
                f"Amount ({df['amount'].iloc[idx]:.2f}) exceeds 2x department mean ({df['dept_mean'].iloc[idx]:.2f})")
        if rule2_mask.iloc[idx]:
            reasons.append(
                f"Vendor appears {df['vendor_dept_count'].iloc[idx]} times in department (>3 threshold)")
        if rule3_mask.iloc[idx]:
            reasons.append("Transaction occurred at month-end")
        if rule4_mask.iloc[idx]:
            reasons.append(f"Amount is statistical outlier (>mean + 2×std)")
        reasons_list.append(reasons)

    df['reasons'] = reasons_list

    df['riskLevel'] = pd.cut(
        df['riskScore'],
        bins=[-1, 39, 69, 100],
        labels=['Low', 'Medium', 'High']
    )

    results = df[['payment_uid', 'riskScore',
                  'riskLevel', 'reasons']].to_dict(orient='records')

    for result in results:
        result['riskLevel'] = str(result['riskLevel'])
        result['riskScore'] = int(result['riskScore'])

    # Department-wise analytics
    dept_analysis = df.groupby('department').agg({
        'amount': ['sum', 'mean', 'median', 'count'],
        'riskScore': ['mean', 'max']
    }).reset_index()
    dept_analysis.columns = ['department', 'totalAmount', 'avgAmount', 
                              'medianAmount', 'transactionCount', 'avgRiskScore', 'maxRiskScore']
    
    dept_risk_distribution = df.groupby(['department', 'riskLevel']).size().reset_index(name='count')
    dept_risk_pivot = dept_risk_distribution.pivot_table(
        index='department', 
        columns='riskLevel', 
        values='count', 
        fill_value=0
    ).reset_index()
    
    # Vendor-wise analytics
    vendor_analysis = df.groupby('vendor_id').agg({
        'amount': ['sum', 'mean', 'count'],
        'riskScore': ['mean', 'max'],
        'department': lambda x: x.nunique()
    }).reset_index()
    vendor_analysis.columns = ['vendor_id', 'totalAmount', 'avgAmount', 
                                'transactionCount', 'avgRiskScore', 'maxRiskScore', 'departmentCount']
    vendor_analysis = vendor_analysis.sort_values('totalAmount', ascending=False).head(20)
    
    # Convert to dict and handle NaN values
    vendor_analysis_dict = vendor_analysis.to_dict(orient='records')
    for vendor in vendor_analysis_dict:
        vendor['vendor_id'] = str(vendor['vendor_id'])
        vendor['totalAmount'] = float(vendor['totalAmount']) if pd.notna(vendor['totalAmount']) else 0
        vendor['avgAmount'] = float(vendor['avgAmount']) if pd.notna(vendor['avgAmount']) else 0
        vendor['transactionCount'] = int(vendor['transactionCount']) if pd.notna(vendor['transactionCount']) else 0
        vendor['avgRiskScore'] = float(vendor['avgRiskScore']) if pd.notna(vendor['avgRiskScore']) else 0
        vendor['maxRiskScore'] = float(vendor['maxRiskScore']) if pd.notna(vendor['maxRiskScore']) else 0
        vendor['departmentCount'] = int(vendor['departmentCount']) if pd.notna(vendor['departmentCount']) else 0
    
    # Time-based analytics
    if 'transaction_date' in df.columns:
        df['date_only'] = df['transaction_date'].dt.date
        time_analysis = df.groupby('date_only').agg({
            'amount': ['sum', 'count'],
            'riskScore': 'mean'
        }).reset_index()
        time_analysis.columns = ['date', 'totalAmount', 'transactionCount', 'avgRiskScore']
        time_analysis['date'] = time_analysis['date'].astype(str)
        time_analysis = time_analysis.to_dict(orient='records')
    else:
        time_analysis = []
    
    # Month-end analysis
    month_end_stats = df.groupby('isMonthEnd').agg({
        'amount': ['sum', 'mean', 'count'],
        'riskScore': 'mean'
    }).reset_index()
    month_end_stats.columns = ['isMonthEnd', 'totalAmount', 'avgAmount', 'count', 'avgRiskScore']
    
    # Payment mode analysis
    if 'payment_mode' in df.columns:
        payment_mode_analysis = df.groupby('payment_mode').agg({
            'amount': ['sum', 'mean', 'count'],
            'riskScore': 'mean'
        }).reset_index()
        payment_mode_analysis.columns = ['paymentMode', 'totalAmount', 'avgAmount', 
                                          'transactionCount', 'avgRiskScore']
        payment_mode_analysis = payment_mode_analysis.to_dict(orient='records')
    else:
        payment_mode_analysis = []
    
    # Risk level distribution
    risk_distribution = df['riskLevel'].value_counts().to_dict()
    risk_distribution = {str(k): int(v) for k, v in risk_distribution.items()}
    
    # Statistical summary
    statistical_summary = {
        'totalTransactions': int(len(df)),
        'totalAmount': float(df['amount'].sum()),
        'avgAmount': float(df['amount'].mean()),
        'medianAmount': float(df['amount'].median()),
        'stdAmount': float(df['amount'].std()),
        'avgRiskScore': float(df['riskScore'].mean()),
        'highRiskCount': int(len(df[df['riskLevel'] == 'High'])),
        'mediumRiskCount': int(len(df[df['riskLevel'] == 'Medium'])),
        'lowRiskCount': int(len(df[df['riskLevel'] == 'Low'])),
        'uniqueDepartments': int(df['department'].nunique()),
        'uniqueVendors': int(df['vendor_id'].nunique())
    }
    
    # Generate AI explanations for each result
    for result in results:
        explanation = generate_ai_explanation(result['riskScore'], result['reasons'])
        result['aiExplanation'] = explanation
    
    # Investigation analysis - department-level insights
    investigation_insights = []
    for dept_name in df['department'].unique():
        dept_df = df[df['department'] == dept_name]
        total_dept_transactions = len(dept_df)
        high_risk_dept = len(dept_df[dept_df['riskLevel'] == 'High'])
        anomaly_rate = (high_risk_dept / total_dept_transactions * 100) if total_dept_transactions > 0 else 0
        
        # Top risky vendors in this department
        dept_vendor_risk = dept_df.groupby('vendor_id').agg({
            'riskScore': 'mean',
            'amount': 'sum',
            'payment_uid': 'count'
        }).reset_index()
        dept_vendor_risk.columns = ['vendor_id', 'avgRiskScore', 'totalAmount', 'transactionCount']
        dept_vendor_risk = dept_vendor_risk.sort_values('avgRiskScore', ascending=False).head(5)
        
        # Timeline of suspicious payments (high risk only)
        suspicious_timeline = dept_df[dept_df['riskLevel'] == 'High'].sort_values('transaction_date')
        if 'transaction_date' in suspicious_timeline.columns:
            suspicious_timeline_data = suspicious_timeline[['transaction_date', 'amount', 'vendor_id']].head(10)
            suspicious_timeline_data['transaction_date'] = suspicious_timeline_data['transaction_date'].astype(str)
            suspicious_timeline_list = suspicious_timeline_data.to_dict(orient='records')
        else:
            suspicious_timeline_list = []
        
        # Generate recommendation
        recommendation = generate_department_recommendation(
            dept_name, 
            anomaly_rate, 
            high_risk_dept,
            total_dept_transactions,
            dept_vendor_risk
        )
        
        investigation_insights.append({
            'department': dept_name,
            'totalTransactions': int(total_dept_transactions),
            'highRiskCount': int(high_risk_dept),
            'anomalyRate': float(anomaly_rate),
            'topRiskyVendors': dept_vendor_risk.to_dict(orient='records'),
            'suspiciousTimeline': suspicious_timeline_list,
            'recommendation': recommendation,
            'avgAmount': float(dept_df['amount'].mean()),
            'totalAmount': float(dept_df['amount'].sum())
        })
    
    # Sort by anomaly rate
    investigation_insights = sorted(investigation_insights, key=lambda x: x['anomalyRate'], reverse=True)

    response = {
        "datasetId": dataset_id,
        "results": results,
        "analytics": {
            "departmentAnalysis": dept_analysis.to_dict(orient='records'),
            "departmentRiskDistribution": dept_risk_pivot.to_dict(orient='records'),
            "vendorAnalysis": vendor_analysis_dict,
            "timeSeriesAnalysis": time_analysis,
            "monthEndStats": month_end_stats.to_dict(orient='records'),
            "paymentModeAnalysis": payment_mode_analysis,
            "riskDistribution": risk_distribution,
            "statisticalSummary": statistical_summary,
            "investigationInsights": investigation_insights
        }
    }

    return jsonify(response), 200


@app.route('/health', methods=["GET"])
def health():
    """Health check endpoint for monitoring."""
    return jsonify({"status": "healthy", "service": "analytics-engine"}), 200


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
