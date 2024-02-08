# GVContentAI

### Created by Reid Darden in October/November of 2023 for Worldwide Golf Shops / Global Value Commerce. All rights reserved.

**This program was created to generate on-page-articles (in HTML with appropriate formatting) for product pages by parsing sell sheets. These parsed sheets have their content rewritten using a SEO specific prompt in ChatGPT. Finally, another ChatGPT call is made to assemble the article based on a template. All articles that are created with this template will be automatically emailed to Reid Darden (rdarden@wgs.com) for final approval for both content and formatting validation.**

## Technologies Used

### [PDF Parsing: Adobe ExtractPDF SDK]("https://developer.adobe.com/document-services/docs/overview/pdf-extract-api/")

**Used to parse the inputted pdf into excel files**

### [ADM-ZIP]("https://www.npmjs.com/package/adm-zip")

**Reads the contents of the zip file provided by the Adobe SDK**

### [Axios]("https://www.npmjs.com/package/axios")

**Promise based HTTP clients used to handle requests**

### [Express]("https://www.npmjs.com/package/express")

**Web framework used to run the program**

### [Multer]("https://www.npmjs.com/package/multer")

**Middleware used for file uploading. For the sake of the program, it confirms file upload is in a PDF format**

### [Path]("https://www.npmjs.com/package/path")

**Used in site setup to send appropriate files to server.**

### [fs]("https://www.npmjs.com/package/fs")

**Need for file reading**

### [nodemailer]("https://www.npmjs.com/package/nodemailer")

**Sends confirmation email + HTML attachment of article after creation**

### [xlsx]("https://www.npmjs.com/package/xlsx")

**Reads xlsx files and reads data**
