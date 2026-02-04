# Bank Transaction App
An app where people upload their bank PDF files, and shown their purchases listing the categories and the amount of money used.

## Features
* Show the UI to upload only bank PDF statements (other PDF not accepted?)
* Parsing bank PDFs about their transactions, focusing on description, withdrawal and deposit calculating amount in red (negative for withdrawal) and deposit in green (positive for deposit)
-------------------------------------------------------------------------
* From extracted text, read through the description and categorize monthly
* Categorize by groceries, transport, utilities, rent, education, shopping, food, misc. etc. Using AI-based categorization (Optional)
[Easily explained categorization, as test: PTV, groceries (anything with supermarket ex.)]
* Storing transactions in database (Priority pending)
* Visualize the data with categories and amount of money, showing monthly insights
* Optional: Export reports

## Configurations / Tech Stack
* ~~Frontend~~ Full Stack - Next.js (works for client-server)
* ~~Backend (Python - good PDF Parsing according to research)~~

## Test Cases
* PDF uploaded, with extracted text matching with the PDF itself (Works, referenced from another GitHub PDF Parser)
* Extracted text can be parsed, specifically description, withdrawal and deposit (Pending - Not giving a reasonable amount currently)
* Amount will be calculated depending on withdrawal and deposit, in positive (green) or negative (red) (See test above)

## Current Progress
* PDF upload worked, now trying to parse through PDF bank statements. Results: Between looking through any numbers in the statement and giving an astronomical amount or not noticing any numbers within the table due to single/multi-line transactions etc

>What to work with: Ensuring that the pdf parser reads  through the table in any bank statement, regardless of any organization formatting whether it's date or header or titles to the description, withdrawal, deposit and balance = Research required





