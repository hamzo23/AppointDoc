const termscontroller = (req, res) => {
    res.setHeader("Content-Type", "text/html");
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Terms and Conditions</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
            line-height: 1.6;
          }
          h1, h2 {
            color: #333;
          }
          a {
            color: #007bff;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <h1>Terms and Conditions</h1>
        <p>Welcome to AppointDoc. By using our app, you agree to comply with the following terms and conditions. Please read them carefully.</p>
        <h2>1. Medical Information</h2>
        <p>Your medical information is protected under our privacy policy. However, it may be used by verified medical personnel or law enforcement if required.</p>
        <h2>2. Prohibited Activities</h2>
        <p>You agree not to engage in any illegal activities on this platform. Any violation may result in account suspension and legal action.</p>
        <h2>3. Data Usage</h2>
        <p>We collect certain data to improve our services. For more details, refer to our <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.</p>
        <h2>4. Amendments</h2>
        <p>We reserve the right to update these terms at any time. Continued use of the app implies acceptance of any changes.</p>
        <h2>5. Contact Us</h2>
        <p>For any questions or concerns, contact us at support@appointdoc.com.</p>
        <p style="margin-top: 20px;"><strong>By using our services, you agree to these terms and conditions.</strong></p>
      </body>
      </html>
    `);
  };
  
  module.exports = termscontroller;
  