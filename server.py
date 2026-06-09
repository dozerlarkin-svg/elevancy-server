from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import anthropic
import os

app = Flask(__name__)

# Fix CORS for all origins
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "allow_headers": ["Content-Type", "Authorization"],
        "methods": ["GET", "POST", "OPTIONS"]
    }
})


def load_business_info():
    try:
        with open("business_info.txt", "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return ""


def parse_field(info, field):
    for line in info.split("\n"):
        line = line.strip()
        if line.startswith(field + ":"):
            return line.replace(field + ":", "").strip()
    return "Not listed"


def parse_section(info, section):
    lines = info.split("\n")
    collecting = False
    result = []
    for line in lines:
        stripped = line.strip()
        if stripped == section + ":":
            collecting = True
            continue
        if collecting:
            if stripped == "":
                break
            if stripped.endswith(":") and not stripped.startswith("-"):
                break
            result.append(stripped.lstrip("- "))
    return " | ".join(result) if result else "Not listed"


@app.after_request
def after_request(response):
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
    response.headers.add("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
    return response


@app.route("/business-info", methods=["GET", "OPTIONS"])
def business_info():
    info = load_business_info()
    data = {
        "name": parse_field(info, "Business Name"),
        "phone": parse_field(info, "Phone"),
        "location": parse_field(info, "Location"),
        "hours": parse_section(info, "Hours"),
        "services": parse_section(info, "Services"),
        "pricing": parse_section(info, "Pricing"),
    }
    return jsonify(data)


@app.route("/chat", methods=["POST", "OPTIONS"])
def chat():
    if request.method == "OPTIONS":
        return jsonify({}), 200

    info = load_business_info()
    system_prompt = f"""You are a friendly and professional AI receptionist for a local business.
Your job is to help customers by answering their questions and booking appointments.

Here is everything you know about this business:
{info}

How to behave:
- Be warm and friendly like a real receptionist
- Keep answers short — 2 to 3 sentences max
- Always mention free first session 50% off for new players
- If someone wants to book ask for their name phone number and age
- Never make up information not listed above
- End with a helpful follow up question"""

    data = request.json
    messages = data.get("messages", [])

    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=300,
        system=system_prompt,
        messages=messages
    )

    return jsonify({"response": response.content[0].text})


@app.route("/widget.js")
def serve_widget():
    return send_file("widget.js", mimetype="application/javascript")


@app.route("/")
def home():
    return "Elevancy AI Receptionist Server is running!"


if __name__ == "__main__":
    info = load_business_info()
    name = parse_field(info, "Business Name")
    print("=" * 50)
    print("  Elevancy AI Receptionist Server")
    print(f"  Loaded: {name}")
    print("  Running at http://localhost:5000")
    print("=" * 50)
    app.run(debug=False, port=5000)
