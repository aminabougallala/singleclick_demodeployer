# LAB-1861: From Chaos to Clarity: Extract, Query, and Govern Unstructured Data with watsonx.data Integration

!!! abstract "Session abstract · LAB-1861 · Hands-on Lab · Data Management"
    Drowning in unstructured content across Box, SharePoint, S3, and beyond?
    Transform document chaos into queryable enterprise intelligence for
    GenAI, analytics, and compliance. Process technical documents, contracts,
    and reports using IBM's drag-and-drop interface.

    The system automatically analyzes and classifies documents, then
    intelligently extracts text based on context—no manual tagging. Connect
    pre-built operators to ingest from 20+ sources - process, chunk, and
    embed. Dual outputs: vector embeddings for semantic search AND
    structured tables for SQL analytics.

    Beyond open source: Built-in PII redaction, quality checks, governance,
    and lineage—production features open source leaves you to build. Walk
    away with a working pipeline with intelligent classification and
    multi-format insights.

    *Wednesday, October 28, 2026, 10:30 AM – 12:00 PM · Lab 16, Labs & Certifications, Sandbox*

**In this lab, you convert scanned supplier documents into tables that you can query and passages that you can search.**

**Duration:** about 45 minutes

**Products:** watsonx.data integration (unstructured data curation and
processing), watsonx.data (Presto, Iceberg, Milvus), watsonx.ai

## 1 Introduction

Most business information is not stored in databases. It is stored in PDFs,
scans, contracts and forms, and most new business data takes the same form.
This content cannot support a report, a query or an AI assistant until it is
read, classified and extracted.

watsonx.data integration reads these documents for you. **Unstructured data
curation** identifies the type of each document. **Unstructured Data
Integration** then processes each document into two outputs:

- **Extracted values in tables.** Values such as the invoice number, supplier,
  total and due date are written as rows in Iceberg tables in watsonx.data.
  You can query these tables with SQL.
- **Vectors in Milvus.** The text of each document is split into passages, and
  each passage is converted into an embedding. These embeddings support
  semantic search and generative AI.

![Documents become extracted values in tables plus vectors in Milvus](../assets/screens/udi/1-0a-documents-to-data.png){ .screenshot }

*Documents are converted into extracted values in tables and vectors in Milvus.*

> **Explainer - Curation and processing**
> **Curation** is the analysis step. It examines each document, detects its
> language and format, and assigns it to a **document class**, such as Invoice
> or Bill of Lading. **Processing** extracts the fields of each class into a
> table and writes the document text as vectors. You curate first so that you
> process only documents whose content you have identified.

### 1.1 Use case overview

**Summit Outfitters** sells outdoor equipment online. Its suppliers, carriers
and customers send paperwork as scanned documents. The accounts payable and
customer care teams enter the values from these documents manually.

The documents in this lab relate to one shipment of tents and one order of
boots:

- **Purchase order SO-PO-10482**: Summit orders tents and footprints from
  **Ridgeline Tent Co.** in Tacoma, for $33,250.
- **Invoice RTC-INV-7731**: Ridgeline invoices that order, with payment due
  October 15.
- **Bill of lading CFL-BOL-558210**: **Cascade Freight Lines** collects 300
  cartons in Tacoma for delivery to the Summit fulfillment center in Denver.
- **Delivery receipt CFL-DR-558210-01**: the shipment arrives in Denver. Two
  Basecamp 4P cartons are crushed.
- **Invoice ATF-26-0918**: **Alpine Trail Footwear** invoices an order of boots
  and socks, with a 2% discount for payment within 10 days.
- **Return form RMA-30117**: a customer returns a Trailhead 2P tent with a
  cracked pole ferrule.

In this lab, you act as the data engineer for Summit. Your task is to make
these documents answer questions such as *"How much do we owe each supplier,
and when?"* and *"Why did a customer send back a tent?"*, without manual data
entry.

## 2 Getting started

!!! note "Before you start"
    **Keep every browser tab open.** The lab opens several tabs, and later
    steps return to tabs that you opened earlier. Do not close a tab unless a
    step tells you to.

    **Opening links.** To open a link from this guide, right-click it,
    select **Copy link address**, and paste it into a new tab of the browser
    on your main screen.

    **How to read the screenshots.** A red box or a red arrow marks the
    element to click. When one screen needs several actions, the letters
    **A**, **B** and **C** give their order. Names and numbers in the
    screenshots, such as the account name, differ from yours.

--8<-- "labs/_signin.md"

### 2.2 Open the lab project

Your environment is prepared before the session. The lab has its own project,
**LAB-1861 Unstructured Data**, which already contains a connection to the six
documents and the connections to the shared watsonx.data where processing
writes its tables and vectors.

1. Click the **☰** menu in the upper-left corner, click **Projects**, and then
   click **All projects**.

2. Click **LAB-1861 Unstructured Data**. Do not use the project whose name
   starts with `wxdi-auto-demo-`: it belongs to another lab.

3. Click the **Assets** tab.

4. Note the name of your TechZone account in the top bar, for example
   `itz-saas-123`. You use it to name your work in section 3.1 and to search
   your documents in part 6, because the watsonx.data that stores the results
   is shared by everyone in the room.

**Check your progress:** the **Assets** tab of **LAB-1861 Unstructured Data**
lists the connections **udi_lab_documents**, **udi_lab_presto** and
**udi_lab_milvus**.

## 3 Analyze the documents

Before the documents can be used, each document must be identified. In this
section, watsonx.data integration classifies the documents in a few minutes,
without you opening any file.

### 3.1 Create the curation asset

1. On the **Assets** tab, click **New asset**.

    ![New asset](../assets/screens/udi/3-1a-new-asset.png){ .screenshot }

2. In the **Find a task or tool** field, type `unstructured` (A). Then click
   **Analyze and enrich unstructured data** (B).

    ![Analyze and enrich unstructured data](../assets/screens/udi/3-1b-tile.png){ .screenshot }

3. In the **Name** field, type your account name followed by
   `supplier documents`, for example `itz-saas-123 supplier documents` (A).
   Then click **Save** (B). The account name at the start keeps your document
   sets apart from everyone else's in the shared watsonx.data.

    ![Name the curation asset](../assets/screens/udi/3-1c-name.png){ .screenshot }

4. The first time you create a curation asset, a short product tour opens.
   Click **Skip**.

    ![Skip the tour](../assets/screens/udi/3-1d-tour.png){ .screenshot }

!!! tip "Asset creation failed: Missing required entitlement?"
    If **Save** returns the message *Asset creation failed ... Missing
    required entitlement for user*, create a task credential first. Click
    your profile icon in the upper-right corner, then click **Profile and
    settings**. Open the **Task Credentials** tab and click **Create task
    credential**. Enter a name and click **Create**. Then return to the
    project and create the curation asset again.

**Check your progress:** the breadcrumb ends with the name of your curation asset,
and the page shows an **Add documents** button.

### 3.2 Add the documents

1. Click **Add documents** (A), and then click **From connection** (B).

    ![Add documents from a connection](../assets/screens/udi/3-2a-add-menu.png){ .screenshot }

2. Click **udi_lab_documents**. The lab setup created this connection to the
   storage bucket.

    ![The documents connection](../assets/screens/udi/3-2b-connection.png){ .screenshot }

3. Select the **Summit Documents** check box (A). **Selected assets** shows
   **1 / 1**. Click **Add and analyze** (B).

    ![Select the folder and analyze](../assets/screens/udi/3-2c-select-folder.png){ .screenshot }

4. Wait while the analysis runs. The status progresses through **Analysis
   queued**, **Ingesting documents**, **Classifying documents**, **Extracting
   data**, **Identifying document language** and **Finalizing analysis**. The
   analysis takes about 3 minutes.

    ![The analysis running](../assets/screens/udi/3-2d-analyzing.png){ .screenshot }

> **Explainer - Document classes**
> A **document class** describes one type of document: its appearance and the
> fields to extract from it. watsonx.data integration includes classes for
> common business documents, such as Invoice, Purchase Order, Bill of Lading
> and Delivery Receipt. The analysis assigns each document to the class that
> matches it most closely.

### 3.3 Review the results

**Check your progress:** the documents are grouped by **Document class**:

- **Invoice**: 2 documents, the Ridgeline and Alpine Trail invoices
- **Delivery Receipt**: 1
- **Bill of Lading**: 1
- **Purchase Order**: 1
- **Without document class**: 1, the customer return form

![The analysis results](../assets/screens/udi/3-3a-results.png){ .screenshot }

The built-in classes identify five of the six documents. The return form is a
document type that is specific to Summit, so no built-in class matches it. In
the next section, you add a class for it.

!!! tip "A supplier document has no class?"
    An AI model performs the classification, so a run can occasionally place
    a supplier document in **Without document class**. Continue with the lab.
    The **Reanalyze** step in section 4 usually assigns the document to the
    correct group.

## 4 Add a custom document class

Most businesses use document types that are specific to them. In this
section, you define a class for the Summit product return form and the fields
that customer care needs from it. Returns can then be counted and searched in
the same way as the other documents.

### 4.1 Import the Product Return Request class

The class definition is provided as a file. It describes the return form and
lists the 14 fields to extract, such as the RMA number, the customer, the
product, the reason for return and the decision.

1. Download [ProductReturnRequest.json](../assets/udi-lab/ProductReturnRequest.json)
   to your computer.

2. In the left navigation rail, click the **Document classes** icon, which is
   the second icon.

    ![The Document classes icon](../assets/screens/udi/4-1a-classes-icon.png){ .screenshot }

3. At the bottom of the class list, click **Add class** (A), and then click
   **Import class** (B).

    ![Import class](../assets/screens/udi/4-1b-add-class-menu.png){ .screenshot }

4. Click **Drag and drop file here or click to upload**, and select the
   **ProductReturnRequest.json** file that you downloaded (A). Click
   **Import** (B).

    ![Import the class file](../assets/screens/udi/4-1d-import-dialog.png){ .screenshot }

**Check your progress:** **Product Return Request** appears in the class list,
with its description and its fields, such as **rma_number** and
**request_date**.

![The new class](../assets/screens/udi/4-1e-class-imported.png){ .screenshot }

You can also create the same class manually. Click **Add class** → **New
class**, enter a name and a description, and add each field. Importing a file
is faster, and a file lets a team reuse the same class across projects.

> **Explainer - What makes a good class**
> The model reads the class **description** to decide whether a document
> belongs to the class. The description therefore names the words that are
> expected on the page. Each **field** has a name, a description and an
> example value. Each field becomes a column in the table for the class.

### 4.2 Reanalyze

1. In the left navigation rail, click the **Documents** icon, which is the
   first icon. The document groups are displayed.

2. Click the arrow next to **Process documents** (A), and then click
   **Reanalyze** (B).

    ![Reanalyze](../assets/screens/udi/4-2a-reanalyze-menu.png){ .screenshot }

3. The button shows **Starting analysis...**, and the analysis runs again. The
   analysis takes about 2 minutes.

    ![The reanalysis starting](../assets/screens/udi/4-2b-reanalyzing.png){ .screenshot }

**Check your progress:** the return form appears in its own group, **Product
Return Request**. The **Without document class** group no longer appears, and
every document has a class.

![Every document has a class](../assets/screens/udi/4-2c-reanalyzed.png){ .screenshot }

## 5 Process the documents into tables and vectors

Classification alone does not provide values that accounts payable can use.
Processing extracts the fields of each class into a table in the lakehouse
and writes the document text to a vector store. Both SQL queries and AI
applications can then use the content.

### 5.1 Configure processing

Processing requires output locations. The lab setup created two connections
for this purpose: **udi_lab_milvus** for the vectors and **udi_lab_presto**
for the tables.

1. Click **Configure processing**.

    ![Configure processing](../assets/screens/udi/5-1a-configure.png){ .screenshot }

2. Scroll down. Next to **Default output vector database connection**, click
   **Select**.

    ![The vector database connection](../assets/screens/udi/5-1c-vector-select.png){ .screenshot }

3. Click **udi_lab_milvus** (A), and then click **Select** (B).

    ![udi_lab_milvus](../assets/screens/udi/5-1d-milvus.png){ .screenshot }

4. Next to **Default database connection for structured output**, click
   **Select**.

    ![The structured output connection](../assets/screens/udi/5-1e-structured-select.png){ .screenshot }

5. Click **udi_lab_presto**.

    ![udi_lab_presto](../assets/screens/udi/5-1f-presto.png){ .screenshot }

6. Click **techxchange_udi**, the Iceberg catalog of the lab in watsonx.data.

    ![The lab catalog](../assets/screens/udi/5-1g-catalog.png){ .screenshot }

7. Select the schema named after your account, for example
   **udi_itz_saas_123** (A), and then click **Select** (B). Select only your
   own schema: the other schemas belong to the other students in the room.

    ![Your schema](../assets/screens/udi/5-1h-schema.png){ .screenshot }

8. Verify that the vector connection shows **udi_lab_milvus** (A) and that the
   structured output shows **udi_lab_presto techxchange_udi /
   udi_<your account>** (B). Click **Save** (C).

    ![The processing settings](../assets/screens/udi/5-1i-config-done.png){ .screenshot }

> **Explainer - Embeddings and vectors**
> An **embedding model**, in this lab **ibm/granite-embedding-278m-multilingual**,
> converts a passage of text into a list of numbers called a **vector**.
> Passages with similar meanings produce similar vectors. **Milvus** stores
> these vectors and returns the vectors closest to a question, even when the
> question uses different words.

### 5.2 Process the document groups

1. Select the **Select all document groups** check box. If a **Without
   document class** group is still listed, clear its check box. That group
   has no class, so it has no fields to extract.

    ![Select all document groups](../assets/screens/udi/5-2-select-all.png){ .screenshot }

2. The blue bar shows **5 groups selected**. In the blue bar, click **Process
   documents**.

    ![Process the selected groups](../assets/screens/udi/5-2a-groups-selected.png){ .screenshot }

3. Review the **Process documents** panel. It shows the source, the enabled
   steps (**Make data ready for AI** and **Extract structured information**),
   the two output connections and one **Document set** per class. Click
   **Process documents**.

    ![The Process documents panel](../assets/screens/udi/5-2b-process-panel.png){ .screenshot }

4. When the **Save the updated settings?** prompt appears, click **Save
   settings**.

    ![Save settings](../assets/screens/udi/5-2c-save-settings.png){ .screenshot }

**Check your progress:** the upper-right corner shows **Processing queued**.
A **Document processing** panel lists the five document sets that are being
created.

![Processing started](../assets/screens/udi/5-2d-processing.png){ .screenshot }

> **Explainer - Unstructured Data Integration flows**
> When you click **Process documents**, the curation asset generates an
> **Unstructured Data Integration flow**. The flow is the pipeline that
> ingests, parses, chunks, embeds and extracts the documents. The curation
> asset runs the flow as a **job**, so you do not need to design the flow. You
> can later open the flow in your project, change any step, or schedule the
> job to process new documents every night.

### 5.3 Monitor the job

Processing takes about 5 minutes. You can monitor its progress from the
project.

1. In the breadcrumb at the top of the page, click **LAB-1861 Unstructured
   Data**.

2. Click the **Jobs** tab.

    ![The Jobs tab](../assets/screens/udi/5-3a-jobs-tab.png){ .screenshot }

3. Click the job whose name starts with **Processing flow 1 for** and the name
   of your curation asset. The job name ends with the date and time when you
   started processing.

    ![The processing job](../assets/screens/udi/5-3b-job-running.png){ .screenshot }

4. The job run shows the status **Running**. Refresh the page about once per
   minute.

    ![The job run running](../assets/screens/udi/5-3c-job-runs.png){ .screenshot }

**Check your progress:** the job run shows the status **Completed** after
about 3 to 4 minutes of run time.

![The job run completed](../assets/screens/udi/5-3d-job-done.png){ .screenshot }

### 5.4 Review the results

1. In the breadcrumb, click your project name.

2. Click the **Assets** tab. Your project now contains five **Document set**
   assets (A), one for each class, and five tables (B): **Purchase_Order**,
   **Bill_of_Lading**, **Invoice**, **Delivery_Receipt** and
   **Product_Return_Request**.

    ![Document sets and tables](../assets/screens/udi/5-4a-assets.png){ .screenshot }

3. Click **Invoice**.

    ![Open the Invoice table](../assets/screens/udi/5-4b-open-invoice.png){ .screenshot }

4. Review the **Preview asset** tab. It shows one row for each invoice, with
   33 columns extracted from the scans, such as **invoice_id**,
   **invoice_date** and **customer_name**.

    ![The Invoice table](../assets/screens/udi/5-4c-invoice-asset.png){ .screenshot }

5. Close the **About this asset** panel and scroll the table to the right. The
   **vendor_name** column shows **Ridgeline Tent Co.** and **Alpine Trail
   Footwear**, followed by their addresses, phone numbers and bank details.
   The **total** and **due_date** columns appear further to the right.

    ![Values extracted from the invoices](../assets/screens/udi/5-4d-invoice-values.png){ .screenshot }

!!! tip "One document set has a long technical name"
    Most document sets have names such as
    `itz_saas_123_supplier_documents___Document_set___Invoice`. The Product
    Return Request document set can show a shortened name that contains an ID,
    because the full name exceeds the length limit. The document set content is
    the same.

These tables give accounts payable the values that the team previously
entered manually. The values are stored in Iceberg tables, which any engine
that reads the lakehouse can query with SQL.

## 6 Query your documents

Tables answer questions about amounts and dates. Vectors answer questions
about reasons and events, based on the text of the documents. In this
section, you ask both types of question.

The **Document search** page uses the outputs that you created. It searches
the vectors that your job wrote to Milvus, and it uses watsonx.ai to write SQL
queries over the tables that your job wrote to watsonx.data. It searches only
the document sets and the schema of the account that you enter.

### 6.1 Open Document search

1. Copy the following link and paste it into a new tab of the browser on your
   main screen: <https://udi-search.23ij0n2ztu5p.ca-tor.codeengine.appdomain.cloud/>

2. The **Document search** page opens. It does not require you to sign in. In
   **Your TechZone account**, type your account name, for example
   `itz-saas-123`.

    ![Document search](../assets/screens/udi/6-1b-search-page.png){ .screenshot }

### 6.2 Search the documents

1. In the **Your question** field, type `Why did a customer send back a tent?`
   (A). Then click **Search documents** (B).

    ![Ask about the returned tent](../assets/screens/udi/6-2a-q1-ask.png){ .screenshot }

    **Check your progress:** the first result under **Closest passages** comes
    from **return_warranty_request_rma_30117.pdf**. It describes the
    Trailhead 2P tent from Ridgeline that Jordan Ellis returned. The search
    matches by meaning: the document contains the word "tent" but not the
    phrase "send back".

    ![The return form](../assets/screens/udi/6-2a-q1-result.png){ .screenshot }

2. Replace the question with `Was anything damaged when the Ridgeline shipment
   reached Denver?` and click **Search documents**.

**Check your progress:** the passages come from the shipping documents. The
bill of lading usually appears first. The second passage, from
**delivery_receipt_cfl_dr_558210.pdf**, reads *"298 cartons in
good condition, 2 cartons damaged ... Two Basecamp 4P cartons on pallet 9
crushed at one corner"*.

![The delivery receipt](../assets/screens/udi/6-2b-q2-result.png){ .screenshot }

Optionally, enter one more question: *Which supplier offers a discount for
early payment?* The first passage comes from the Alpine Trail Footwear
invoice. It offers a $557.20 discount for payment by October 4, 2026.

### 6.3 Query the tables

1. Replace the question with `How much do we owe each supplier and when is it
   due?` (A). Then click **Ask the tables** (B).

    ![Ask the tables](../assets/screens/udi/6-3a-q3-ask.png){ .screenshot }

**Check your progress:** under **Query written by watsonx.ai**, the page shows
the SQL query that watsonx.ai generated over the **Invoice** table. The result
appears below the query: **ridgeline tent co.**, **33250**, due
**2026-10-15**, and **alpine trail footwear llc**, **28480**, due
**2026-10-24**.

![Amounts owed and due dates](../assets/screens/udi/6-3a-q3-result.png){ .screenshot }

The generated SQL can vary between runs, because a language model generates
it. The amounts and dates do not vary, because they are the values extracted
from the invoices in part 5.

## 7 Summary

You started with six scanned documents of unknown content. In about 45
minutes, and without writing code, you completed the following tasks. You
classified the documents by type. You added a document class for a document
type that is specific to Summit. You extracted the fields into tables in
watsonx.data and wrote the text to Milvus as vectors. You then answered
questions from both outputs.

**Key takeaways**

**Documents become data** – Unstructured data curation reads scans and PDFs,
identifies the type of each document, and extracts the relevant fields into
Iceberg tables that any SQL engine can query.

**Your business, your document types** – The built-in classes cover common
business documents. A custom class, imported from a file or created in the
UI, covers document types that are specific to your business.

**Ready for AI and for analytics at once** – One processing run populates a
vector store for semantic search and generative AI, and the lakehouse for
reports and SQL, from the same governed source.

**No pipeline to hand-build** – Curation generates the Unstructured Data
Integration flow and its job. You can open, change and schedule the flow like
any other flow in the project.

## 8 Reference

- [Working with unstructured data in watsonx.data](https://www.ibm.com/docs/en/watsonxdata/saas?topic=data-working-unstructured)
- [Curating unstructured data](https://dataplatform.cloud.ibm.com/docs/content/wsj/curation/curation-unstructured.html?context=df)
