import json
import boto3

bedrock = boto3.client("bedrock-runtime")


def lambda_handler(event, context):
    print("EVENT:")
    print(json.dumps(event))

    try:
        if "body" in event:
            body = json.loads(event["body"])
        else:
            body = event

        question = body["question"]

        prompt = f"""
You are an AWS Cloud Practitioner assistant.
Answer clearly and briefly.

Question:
{question}
"""

        request_body = {
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"text": prompt}
                    ]
                }
            ],
            "inferenceConfig": {
                "maxTokens": 300,
                "temperature": 0.3
            }
        }

        response = bedrock.invoke_model(
            modelId="amazon.nova-lite-v1:0",
            body=json.dumps(request_body)
        )

        response_body = json.loads(response["body"].read())

        print("BEDROCK RESPONSE:")
        print(json.dumps(response_body))

        answer = response_body["output"]["message"]["content"][0]["text"]

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({"answer": answer})
        }

    except Exception as e:
        print("ERROR:")
        print(str(e))
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({"error": str(e)})
        }
