from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
import os.path
import pickle
import pandas as pd

# If modifying these scopes, delete the file token.pickle.
SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']

# The ID of your spreadsheet
SPREADSHEET_ID = '12QgLxtavdCa9FkfTeMDogXA0COYBCxmUZKHDXybOzaU'

def get_credentials():
    creds = None
    # The file token.pickle stores the user's access and refresh tokens
    if os.path.exists('token.pickle'):
        with open('token.pickle', 'rb') as token:
            creds = pickle.load(token)
    
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                'credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        # Save the credentials for the next run
        with open('token.pickle', 'wb') as token:
            pickle.dump(creds, token)

    return creds

def analyze_sheet():
    """Analyzes the structure of the Google Sheet."""
    creds = get_credentials()
    service = build('sheets', 'v4', credentials=creds)

    # Get the sheet metadata
    sheet_metadata = service.spreadsheets().get(spreadsheetId=SPREADSHEET_ID).execute()
    sheets = sheet_metadata.get('sheets', '')
    
    print("\n=== Sheet Names ===")
    for sheet in sheets:
        properties = sheet.get('properties', {})
        title = properties.get('title', '')
        print(f"- {title}")
    
    print("\n=== Analyzing Sheet Structure ===")
    for sheet in sheets:
        title = sheet.get('properties', {}).get('title', '')
        print(f"\nAnalyzing '{title}':")
        
        # Get the first row (headers) and first few data rows
        range_name = f"{title}!A1:ZZ5"
        try:
            result = service.spreadsheets().values().get(
                spreadsheetId=SPREADSHEET_ID,
                range=range_name
            ).execute()
            values = result.get('values', [])
            
            if not values:
                print('No data found.')
                continue
                
            # Print column headers
            headers = values[0]
            print(f"\nFound {len(headers)} columns:")
            for i, header in enumerate(headers):
                col_letter = chr(65 + (i // 26) - 1) + chr(65 + (i % 26)) if i >= 26 else chr(65 + i)
                print(f"{col_letter}: {header}")
            
            # Print sample data
            if len(values) > 1:
                print("\nSample data row:")
                for i, value in enumerate(values[1]):
                    if i < len(headers):
                        print(f"{headers[i]}: {value}")
        
        except Exception as e:
            print(f"Error accessing sheet '{title}': {str(e)}")

if __name__ == '__main__':
    analyze_sheet()
