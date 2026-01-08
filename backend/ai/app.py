from flask import Flask,request,jsonify
import pandas as pd
app = Flask(__name__)


@app.route('/',methods=["POST"])
def home():
    raw_data=request.get_json()
    print(raw_data)
    return "Hello"

if __name__=='__main__':
    app.run(debug=True)
    
