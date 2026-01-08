from flask import Flask, request, jsonify
import pandas as pd
import numpy as np

app = Flask(__name__)


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

    response = {
        "datasetId": dataset_id,
        "results": results
    }

    return jsonify(response), 200


@app.route('/health', methods=["GET"])
def health():
    """Health check endpoint for monitoring."""
    return jsonify({"status": "healthy", "service": "analytics-engine"}), 200


if __name__ == '__main__':
    app.run(debug=True, port=5000)
