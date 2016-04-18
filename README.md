# Node.js example for IBM Watson Analytics

## Setup
1. Download the Node.js installer from https://nodejs.org/en/download/.
2. Install Node.js.
3. Get your Watson Analytics API key (client id and secret) from https://developer.ibm.com/api/list.
4. Register your client id and client secret. Use "http://localhost:5447/demo/oauth2/code" as your redirect URI. You only need to call this operation once unless the client ID changes. Use the following CURL command. Replace the details with your information.
```
curl -v -X PUT -H "X-IBM-Client-Secret:YOUR_CLIENT_SECRET" -H "X-IBM-Client-Id:YOUR_CLIENT_ID" -H "Content-Type: application/json" -d '{"clientName": "The Sample Outdoors Company", "redirectURIs": 'https://example.com:5443", "ownerName": "John Smith", "ownerEmail": "John.Smith@example.com", "ownerCompany": "example.com", "ownerPhone": "555-123-4567"}' https://api.ibm.com/watsonanalytics/run/oauth2/v1/config
```
5. Create a file called `appkey.json` that matches the following template. Enter your client id and secret. Save it in the application folder.
```
	{
  		"client_id": "YOUR_CLIENT_ID",
  		"client_secret": "YOUR_CLIENT_SECRET"
	}
```
6. To install the application, type `npm install` at the command line.
7. To start the application, type `npm start`.
8. To run the application, open a web browser and navigate to this address: https://localhost:5447.

## Notes
* For clarity, this sample application uses `localhost` as part of the URL for the application. However, when you create your own application, do not use localhost.
* This sample application is simplified to emphasize the code that you need to work with Watson Analytics. For example, it contains minimal error checking.
