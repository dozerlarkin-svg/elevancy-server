from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import anthropic
import os

app = Flask(__name__)
CORS(app, origins="*", allow_headers=["Content-Type"])

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))


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


@app.route("/business-info", methods=["GET"])
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


@app.route("/chat", methods=["POST"])
def chat():
    info = load_business_info()
    system_prompt = f"""You are a friendly and professional AI receptionist for a local business.
Your job is to help customers by answering their questions and booking appointments.

Here is everything you know about this business:
{info}

How to behave:
- Be warm and friendly like a real receptionist
- Keep answers short — 2 to 3 sentences max
- Always mention free estimates when pricing comes up
- If someone wants to book ask for their name and phone number
- For emergencies give the phone number immediately
- Never make up information not listed above
- End with a helpful follow up question"""

    data = request.json
    messages = data.get("messages", [])

    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=300,
        system=system_prompt,
        messages=messages
    )

    return jsonify({"response": response.content[0].text})


@app.route("/widget.js")
def serve_widget():
    """Serves the embed script to any website."""
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
