from mitmproxy import http
import json
try:
    import sqlite3
except ImportError:
    print("SQLite Error")
    exit(1)
import random
import os

def clear_console():
    os.system('cls' if os.name == 'nt' else 'clear')

def print_boxed_message(message):
    lines = message.split('\n')
    width = max(len(line) for line in lines)
    print('╔' + '═' * (width + 2) + '╗')
    for line in lines:
        print(f'║ {line.ljust(width)} ║')
    print('╚' + '═' * (width + 2) + '╝')

clear_console()

title = "🔥🔥🔥 WELCOME TO ONECHANGER CRACK 🔥🔥🔥"
subtext = """Welcome to Onechanger Crack!
Please login as anh934@gmail.com and set proxy to 127.0.0.1:8080"""

print("=" * len(title))
print(title)
print("=" * len(title))
print()
print_boxed_message(subtext)
print()
print("👉 Tool started. Please make sure your proxy is active.")


# Fake IMEI
def generate_fake_imei():
    return ''.join(str(random.randint(0, 9)) for _ in range(15))

# Fake MAC
def generate_fake_mac():
    hex_chars = '0123456789ABCDEF'
    mac = ''.join(random.choice(hex_chars) for _ in range(12))
    return ':'.join(mac[i:i+2] for i in range(0, 12, 2)).lower()

def request(flow: http.HTTPFlow) -> None:
    target_url = "5imljjlhj5b7bgt542y4xi7qyq.appsync-api.ap-southeast-1.amazonaws.com/graphql"
    if target_url in flow.request.url:
        try:
            body = json.loads(flow.request.content.decode())
            query = ' '.join(body['query'].split())

            #  Request 1: getActiveLicensesBySerialNo
            if 'getActiveLicensesBySerialNo' in query:
                serial_no = body['variables']['serialNo']
                response = {
                    "data": {
                        "getActiveLicensesBySerialNo": {
                            "licenses": [{
                                "serialNo": serial_no,
                                "durationInDay": 1826,
                                "email": "anh934@gmail.com",
                                "type": "PRO",
                                "dateEnd": 1906176071000,
                                "dateStart": 1747117740000,
                                "model": "TISSOT"
                            }]
                        }
                    }
                }
                flow.response = http.Response.make(
                    200, json.dumps(response).encode(), {"Content-Type": "application/json"}
                )
                return

            #  Request 2: getDeviceV2
            if 'getDeviceV2' in query:
                serial_no = body['variables']['serialNo']
                try:
                    conn = sqlite3.connect('devices.sqlite')
                    cursor = conn.cursor()
                    cursor.execute('SELECT * FROM devices ORDER BY RANDOM() LIMIT 1')
                    row = cursor.fetchone()
                    conn.close()
                except sqlite3.Error as e:
                    flow.response = http.Response.make(
                        500, json.dumps({"error": f"Lỗi database: {str(e)}"}).encode(), {"Content-Type": "application/json"}
                    )
                    return

                if not row:
                    flow.response = http.Response.make(
                        404, json.dumps({"error": "Không tìm thấy thiết bị"}).encode(), {"Content-Type": "application/json"}
                    )
                    return

                columns = [desc[0] for desc in cursor.description]
                device = dict(zip(columns, row))
                response = {"data": {"getDeviceV2": device}}
                flow.response = http.Response.make(
                    200, json.dumps(response).encode(), {"Content-Type": "application/json"}
                )
                return

            # Query False
            flow.response = http.Response.make(
                400, json.dumps({"error": "Query không được hỗ trợ"}).encode(), {"Content-Type": "application/json"}
            )
        except Exception as e:
            flow.response = http.Response.make(
                500, json.dumps({"error": f"Lỗi xử lý request: {str(e)}"}).encode(), {"Content-Type": "application/json"}
            )