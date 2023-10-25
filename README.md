# GVContentAI

### Created by Reid Darden in October of 2023. All rights reserved.

**This program was created to generate on page articles (in HTML w/ appropriate formatting) for product pages by parsing sell sheets. These parsed sheets have their content rewritten using a SEO specific prompt in ChatGPT. Finally, another ChatGPT call is made to assemble the article based on a template. All articles that are created with this template will be automatically emailed to Reid Darden (rdarden@wgs.com) for final approval for both content and formatting validation.**

## Technologies Used

### [PDF Parsing: Adobe ExtractPDF SDK]("https://developer.adobe.com/document-services/docs/overview/pdf-extract-api/")

**Used to parse the inputted pdf into excel files**

### [ADM-ZIP]("https://www.npmjs.com/package/adm-zip")

**Reads the contents of the zip file provided by the Adobe SDK**

### [Axios]("https://www.npmjs.com/package/axios")

**Promise based HTTP clients used to handle requests**

### [Express]("https://www.npmjs.com/package/express")

**Web framework used to run the program**

### [Node-xlsx]("https://www.npmjs.com/package/node-xlsx")

**Used to extract data from the excel file provided by the Adobe SDK**

### [Multer]("https://www.npmjs.com/package/multer")

**Middleware used for file uploading. For the sake of the program, it confirms file upload is in a PDF format**

### [Path]("https://www.npmjs.com/package/path")

**Used in site setup to send appropriate files to server.**
