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

**In this lab, you turn six scanned supplier documents into tables that you can query with SQL and passages that an AI application can search.**

**Duration:** about 60 minutes

**Capabilities:** unstructured data curation and unstructured data
processing in watsonx.data integration; the Presto engine, Iceberg tables and
the Milvus vector database in watsonx.data; watsonx.ai

## 1 Introduction

Most business information is not stored in databases. It is stored in PDFs,
scans, contracts and forms, and analysts estimate that 80 to 90 percent of new
enterprise data takes this form. This content cannot feed a report, a query
or an AI assistant until someone reads it, identifies what it is, and extracts
the values in it.

In this lab, watsonx.data integration does that work. You complete four
objectives:

1. **Connect the sources and the destinations.** You review the connections
   to the documents, to the lakehouse that stores tables, and to the vector
   database that stores passages for AI.
2. **Analyze and classify the documents.** Curation identifies the type of
   every document, such as an invoice or a bill of lading, without you opening
   a file. You add a document type of your own for a form that is specific to
   your business.
3. **Process the documents.** One run extracts the fields of every document
   into tables and splits the text into searchable passages.
4. **Use the results.** You query the extracted values with SQL and search the
   passages by meaning, the way an AI assistant does.

![Documents become extracted values in tables plus vectors in Milvus](../assets/screens/udi/1-0a-documents-to-data.png){ .screenshot }

*Documents are converted into extracted values in tables and vectors in Milvus.*

!!! explainer "Unstructured data curation and unstructured data processing"
    **Unstructured data curation** is the tool you use in this lab. You point
    it at a folder of documents, and it analyzes them: it detects each
    document's format and language and assigns each document to a **document
    class**, such as Invoice. You review the result and correct it before
    anything is extracted.

    **Unstructured data processing** (also called Unstructured Data
    Integration) does the heavy work. When you click **Process documents**,
    curation generates a processing **flow**: a pipeline that reads each
    document, extracts its fields, splits its text into passages, converts the
    passages into vectors, and writes everything to its destinations. You do
    not design this flow yourself, but you can open and change it later.

### 1.1 Use case overview

**Summit Outfitters** sells outdoor equipment online. Its suppliers, carriers
and customers send paperwork as scanned documents. Today, the accounts
payable and customer care teams copy the values from these documents by hand.

The six documents in this lab relate to one shipment of tents and one order of
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

You act as the data engineer for Summit. Your task is to make these documents
answer questions such as *"How much do we owe on each invoice, and when?"*
and *"Why did a customer send back a tent?"*, without manual data entry.

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
    screenshots, such as the account name `itz-saas-390`, differ from yours.

--8<-- "labs/_signin-udi.md"

### 2.2 Create a task credential

The processing job that you start in part 6 runs under your own identity, so
the platform needs a key that it can use on your behalf.

!!! explainer "Task credentials"
    A job can continue to run after you close your browser, so it cannot use
    your browser session. A **task credential** is an API key that the
    platform stores and uses whenever one of your jobs runs. Without a task
    credential, a run fails before it starts with the message *"Missing user
    API key"*. You create a task credential once per account.

1. Click the **profile** icon in the upper-right corner (A), then click
   **Profile and settings** (B).

    ![Profile and settings](../assets/screens/lab/2-4a-profile-menu.png){ .screenshot }

2. Click the **Task Credentials** tab.

    ![The Task Credentials tab](../assets/screens/lab/2-4b-settings.png){ .screenshot }

3. Click **Create task credential**.

    ![Create task credential](../assets/screens/lab/2-4c-task-credentials.png){ .screenshot }

4. Enter a **Name**, for example `techxchange-lab` (A), and click **Create** (B).

    ![Name the credential](../assets/screens/lab/2-4d-create-dialog.png){ .screenshot }

**Check your progress:** the credential is listed with a green status. If a
credential is already listed, you do not need a second one.

![The task credential](../assets/screens/lab/2-4e-credential-created.png){ .screenshot }

### 2.3 Open the lab project

!!! warning "Use the project LAB-1861 Unstructured Data"
    Your account contains two projects. Work only in **LAB-1861
    Unstructured Data**. The project whose name starts with
    `wxdi-auto-demo-` belongs to another lab: do not open it and do not
    change anything in it.

!!! explainer "Projects"
    A **project** is a shared workspace. It holds the connections to your
    data, the assets that you create, and the jobs that run them. Your
    project was prepared before the session: it already contains the
    connections that this lab needs.

1. Click the **☰** menu in the upper-left corner. Click **Projects** (A), and
   then click **All projects** (B).

    ![All projects](../assets/screens/udi2/2-2a-projects-menu.png){ .screenshot }

2. Click **LAB-1861 Unstructured Data**.

    ![The lab project](../assets/screens/udi2/2-2b-projects-list.png){ .screenshot }

3. Note the name of your TechZone account in the top bar, for example
   `itz-saas-390`. You type it in part 8.

**Check your progress:** the **Assets** tab of **LAB-1861 Unstructured Data**
lists three connections: **udi_lab_milvus**, **udi_lab_presto** and
**udi_lab_documents**.

![The three connections](../assets/screens/udi2/2-2c-assets.png){ .screenshot }

## 3 Objective 1: Connect the sources and the destinations

A pipeline needs a place to read from and places to write to. In this
part, you look at the three connections in your project and test each one.
You do not change them.

!!! explainer "Connections"
    A **connection** stores how to reach a data source: its address and the
    credentials to use. Every tool in the project uses the same connection,
    so the credentials are entered once and never appear in a flow.

### 3.1 The documents: Cloud Object Storage

The six scanned documents are stored as PDF files in a folder called
**Summit Documents** in **IBM Cloud Object Storage**, in your own account.

!!! explainer "Cloud Object Storage"
    **Object storage** keeps files of any type, such as PDFs, images and
    exports, in containers called **buckets**. It is the usual landing place
    for documents that arrive from scanners, email and other systems. In other
    environments, the same documents could come from Box, SharePoint, Amazon
    S3 or a file share: curation reads from all of them.

1. On the **Assets** tab, click **udi_lab_documents**.
2. Click **Test connection** in the upper-right corner.

**Check your progress:** the **Testing connection** window shows **Test
successful!** Click **Return to form**, and then click **Cancel** to return
to the project.

![The documents connection works](../assets/screens/udi2/3-1a-documents-test.png){ .screenshot }

### 3.2 The tables: Presto and Iceberg in watsonx.data

The values that processing extracts, such as invoice numbers and totals, are
written as rows in tables in **watsonx.data**. The connection
**udi_lab_presto** points to the Presto engine of a watsonx.data instance
that everyone in the room shares. Each account has its own **schema** in it,
named after the account, for example `udi_itz_saas_390`.

!!! explainer "watsonx.data, Iceberg and Presto"
    **watsonx.data** is IBM's **lakehouse**: tables stored as open files in
    object storage, which many engines can read and write.

    **Apache Iceberg** is the open table format of those files. An Iceberg
    table behaves like a database table, with columns, types and safe updates,
    but it is not locked into one database product. Spark, Presto and other
    engines read the same table.

    **Presto** is the SQL engine that you use in this lab to create and
    query the tables. A **catalog** groups schemas, and a **schema** groups
    tables. The lab catalog is **techxchange_udi**.

1. Click **udi_lab_presto**, and then click **Test connection**.

**Check your progress:** the window shows **Test successful!** Click **Return
to form**, and then click **Cancel**.

![The Presto connection works](../assets/screens/udi2/3-2a-presto-test.png){ .screenshot }

### 3.3 The passages: Milvus

Processing also splits the text of each document into passages and stores
each passage as a **vector** in **Milvus**, the vector database of
watsonx.data. The connection **udi_lab_milvus** points to it.

!!! explainer "Vectors, embeddings and Milvus"
    An **embedding model** reads a passage of text and converts it into a
    list of numbers called a **vector**. Passages with similar meanings
    produce similar vectors, even when they use different words.

    **Milvus** is a database built to store vectors and, given the vector of
    a question, to return the passages whose vectors are closest. This is how
    an AI assistant finds the right paragraph in thousands of documents
    before it writes an answer, a pattern called **retrieval-augmented
    generation (RAG)**.

1. Click **udi_lab_milvus**, and then click **Test connection**.

**Check your progress:** the window shows **Test successful!** Click **Return
to form**, and then click **Cancel**.

![The Milvus connection works](../assets/screens/udi2/3-3a-milvus-test.png){ .screenshot }

### 3.4 The AI service: watsonx.ai

Classification, extraction and embeddings use AI models. They run in a
**watsonx.ai Runtime** service, which is associated with your project.

1. Click the **Manage** tab.
2. Click **Services & integrations** (A).

**Check your progress:** the list shows one service of type **watsonx.ai
Runtime** (B).

![watsonx.ai is associated with the project](../assets/screens/udi2/3-4a-services.png){ .screenshot }

## 4 Objective 2: Analyze and classify the documents

!!! explainer "Document classes"
    A **document class** describes one type of document. It has a
    **description**, which tells the AI model what the document looks like,
    and a list of **fields** to extract, such as `invoice_id` or
    `due_date`. watsonx.data integration includes classes for common business
    documents, such as Invoice, Purchase Order, Bill of Lading and Delivery
    Receipt.

    **Analysis** reads every document and assigns it to the class that
    matches it best. A document that matches no class is listed as **Without
    document class**. Each field of a class later becomes a column of the
    table for that class.

In this part, you let curation analyze the six documents and then look at
what it found in one of them.

### 4.1 Create the curation asset

1. Click the **Assets** tab, and then click **New asset**.

    ![New asset](../assets/screens/udi2/4-1a-new-asset.png){ .screenshot }

2. In the **Find a task or tool** field, type `unstructured` (A). Click
   **Analyze and enrich unstructured data** (B).

    ![Analyze and enrich unstructured data](../assets/screens/udi2/4-1b-tile.png){ .screenshot }

3. In the **Name** field, type your account name followed by
   `supplier documents`, for example `itz-saas-390 supplier documents` (A).
   Click **Save** (B).

    ![Name the curation asset](../assets/screens/udi2/4-1c-name.png){ .screenshot }

4. A short tour opens the first time. Click **Skip**.

    ![Skip the tour](../assets/screens/udi2/4-1d-tour.png){ .screenshot }

**Check your progress:** the breadcrumb ends with the name of your curation
asset, and the page shows an **Add documents** button.

### 4.2 Add and analyze the documents

1. Click **Add documents** (A), and then click **From connection** (B).

    ![Add documents from a connection](../assets/screens/udi2/4-2a-add-menu.png){ .screenshot }

2. Click **udi_lab_documents**.

    ![The documents connection](../assets/screens/udi2/4-2b-connection.png){ .screenshot }

3. Select the **Summit Documents** check box (A). **Selected assets** shows
   **1 / 1**. Click **Add and analyze** (B).

    ![Select the folder and analyze](../assets/screens/udi2/4-2c-select-folder.png){ .screenshot }

4. Wait while the analysis runs. It moves through **Ingesting documents**,
   **Classifying documents**, **Extracting data**, **Identifying document
   language** and **Finalizing analysis**, and takes about 3 minutes.

    ![The analysis in progress](../assets/screens/udi2/4-2d-progress.png){ .screenshot }

### 4.3 Review the classification

**Check your progress:** the documents are grouped by document class (A):
**Invoice** with 2 documents, and **Delivery Receipt**, **Bill of Lading**
and **Purchase Order** with 1 each. The customer return form is listed under
**Without document class** (B).

![The analysis results](../assets/screens/udi2/4-3a-results.png){ .screenshot }

The built-in classes identify five of the six documents. The return form is
specific to Summit, so no built-in class matches it. You add a class for it in
part 5.

Now look at what the analysis found in one invoice.

1. Point to the row **invoice_alpine_atf_26_0918.pdf**, and click the **eye**
   icon at the end of the row (**Open document preview**).

    ![Open document preview](../assets/screens/udi2/4-3b-preview-button.png){ .screenshot }

2. Review the preview. The scanned invoice is shown in the middle (A). On the
   right, the **Field** tab lists the fields of the Invoice class (B). At this
   stage, the values are examples from the class definition; the real values
   are extracted when you process the documents in part 6.

    ![The document and its fields](../assets/screens/udi2/4-3c-preview.png){ .screenshot }

3. Click the **Schema** tab (A). It shows the tables that processing will
   create for an invoice: **Invoice** for the header fields and
   **Invoice_line_items** for each product line (B).

    ![The schema of the Invoice class](../assets/screens/udi2/4-3d-schema.png){ .screenshot }

4. Click the **X** in the upper-right corner to close the preview.

## 5 Add a custom document class

Most businesses use document types that are specific to them. In this part,
you define a class for the Summit product return form and the 14 fields that
customer care needs from it, such as the RMA number, the product and the
reason for return.

!!! explainer "What makes a good class"
    The AI model reads the class **description** to decide whether a document
    belongs to the class, so the description names the words that are
    expected on the page. Each **field** has a name, a description and an
    example value. You can create a class in the editor or import it from a
    JSON file, which lets a team reuse the same class across projects.

### 5.1 Import the Product Return Request class

1. Download [ProductReturnRequest.json](../assets/udi-lab/ProductReturnRequest.json)
   to your computer.

2. In the left rail of the curation asset, click the **Document classes**
   icon, which is the second icon.

    ![The Document classes icon](../assets/screens/udi2/5-1a-classes-icon.png){ .screenshot }

3. At the bottom of the class list, click **Add class** (A), and then click
   **Import class** (B).

    ![Import class](../assets/screens/udi2/5-1b-add-class-menu.png){ .screenshot }

4. Click **Drag and drop file here or click to upload**, and select the
   **ProductReturnRequest.json** file that you downloaded (A). Click
   **Import** (B).

    ![Import the class file](../assets/screens/udi2/5-1c-import-dialog.png){ .screenshot }

**Check your progress:** **Product Return Request** opens (A), with its
description and its fields, such as **rma_number** and **request_date** (B).

![The new class](../assets/screens/udi2/5-1d-class-imported.png){ .screenshot }

### 5.2 Reanalyze

1. In the left rail, click the **Documents** icon, which is the first icon.
2. Click the arrow next to **Process documents** (A), and then click
   **Reanalyze** (B). The analysis runs again and takes about 2 minutes.

    ![Reanalyze](../assets/screens/udi2/5-2a-reanalyze-menu.png){ .screenshot }

**Check your progress:** the legend lists **Product Return Request** (A), and
the return form appears in its own group (B). **Without document class** no
longer appears.

![Every document has a class](../assets/screens/udi2/5-2b-reanalyzed.png){ .screenshot }

## 6 Objective 3: Process the documents

Classification tells you what each document is. Processing extracts its
values and makes its text searchable. In this part, you choose where the
results go and start the processing job.

### 6.1 Configure processing

1. Click **Configure processing**.
2. Scroll down. Next to **Default output vector database connection**, click
   **Select** (A). Next to **Default database connection for structured
   output**, you click **Select** (B) in step 5.

    ![The two outputs](../assets/screens/udi2/6-1a-config-selects.png){ .screenshot }

3. Select **udi_lab_milvus** (A), and then click **Select** (B).

    ![udi_lab_milvus](../assets/screens/udi2/6-1b-milvus.png){ .screenshot }

4. Next to **Default database connection for structured output**, click
   **Select**.
5. Click **udi_lab_presto**.

    ![udi_lab_presto](../assets/screens/udi2/6-1c-presto.png){ .screenshot }

6. Click **techxchange_udi**, the lab catalog in watsonx.data.

    ![The lab catalog](../assets/screens/udi2/6-1d-catalog.png){ .screenshot }

7. Select the schema named after your account, for example
   **udi_itz_saas_390** (A), and then click **Select** (B). The other schemas
   belong to the other students in the room.

    ![Your schema](../assets/screens/udi2/6-1e-schema.png){ .screenshot }

8. Verify that the vector output shows **udi_lab_milvus** (A) and that the
   structured output shows **udi_lab_presto techxchange_udi /
   udi_&lt;your account&gt;** (B). Click **Save** (C).

    ![The processing settings](../assets/screens/udi2/6-1f-config-done.png){ .screenshot }

### 6.2 Process the documents

1. Select the **Select all document groups** check box. The blue bar shows
   **5 groups selected** (A). In the blue bar, click **Process documents** (B).

    ![Process the five groups](../assets/screens/udi2/6-2a-select-all.png){ .screenshot }

2. Review the **Process documents** panel. Two processing steps are on (A):
   **Make data ready for AI**, which writes the passages to Milvus, and
   **Extract structured information**, which writes the tables. The
   **Output** section shows your two connections (B).

    ![The Process documents panel](../assets/screens/udi2/6-2b-process-panel.png){ .screenshot }

3. Scroll down. **Document sets** lists one set per class (A). Click
   **Process documents** (B).

    ![One document set per class](../assets/screens/udi2/6-2c-docsets.png){ .screenshot }

4. When the **Save the updated settings?** window opens, click **Save
   settings**.

    ![Save settings](../assets/screens/udi2/6-2d-save-settings.png){ .screenshot }

!!! explainer "The processing flow and its job"
    When you click **Process documents**, curation generates an
    **Unstructured Data Integration flow**: the pipeline that reads, parses,
    classifies, extracts, chunks and embeds the documents. Curation runs the
    flow as a **job**. Each execution of a job is a **run**, with its own
    status and log. You can open the flow in your project later, change any
    step, or schedule the job to process new documents every night.

    A **document set** is the group of documents of one class, together with
    its passages in Milvus. An AI application uses document sets as its
    search context.

## 7 Monitor the job and review the results

### 7.1 Monitor the run

Processing takes about 5 minutes.

1. In the breadcrumb at the top of the page, click **LAB-1861 Unstructured
   Data**.
2. Click the **Jobs** tab (A). Click the job whose name starts with
   **Processing flow 1 for** and the name of your curation asset (B).

    ![The processing job](../assets/screens/udi2/7-1a-jobs-tab.png){ .screenshot }

3. Under **Runs**, click the start time of the run, which is a date and a
   time.

    ![Open the run](../assets/screens/udi2/7-1b-job-run.png){ .screenshot }

4. The run opens with the flow that curation generated. Each box is a step of
   the pipeline. Wait until the status changes from **Running** to
   **Completed**.

**Check your progress:** **Documents** shows **6** in scope and **6**
processed (A), and the status bar shows **Completed** (B).

![The run completed](../assets/screens/udi2/7-1c-run-done.png){ .screenshot }

### 7.2 Review the tables

1. In the breadcrumb, click **LAB-1861 Unstructured Data**, and then click the
   **Assets** tab.
2. Your project now contains a **Document set** for each class and a
   **TABLE** for each class (A): **Invoice**, **Purchase_Order**,
   **Delivery_Receipt**, **Bill_of_Lading** and **Product_Return_Request**.
   Click **Invoice** (B).

    ![Document sets and tables](../assets/screens/udi2/7-2a-assets.png){ .screenshot }

**Check your progress:** the **Invoice** table shows one row per invoice (A),
with 33 columns that were extracted from the scans, such as **invoice_id**
and **invoice_date**. **Connection details** shows that the table is stored in
your schema of the **techxchange_udi** catalog in watsonx.data (B).

![The Invoice table](../assets/screens/udi2/7-2b-invoice.png){ .screenshot }

These are the values that accounts payable used to type by hand. Because they
are stored in Iceberg tables, any engine that reads the lakehouse can query
them with SQL.

## 8 Objective 4: Use the results

Tables answer questions about amounts and dates. Passages answer questions
about reasons and events. In this part, you ask both kinds of question in the
**Document search** page, which reads the outputs of your job and nothing
else.

!!! explainer "Two ways to ask a question"
    **Search documents** converts your question into a vector with the same
    embedding model that processing used, and asks Milvus for the three
    closest passages. It matches by meaning, not by keywords. This is the
    retrieval step of a RAG application.

    **Ask the tables** sends your question and the list of your tables to a
    large language model in watsonx.ai, which writes one SQL query. Presto
    runs the query on your schema and returns the rows. This is called
    **text-to-SQL**.

### 8.1 Open Document search

1. Copy the following link and paste it into a new tab of the browser on your
   main screen: <https://udi-search.23ij0n2ztu5p.ca-tor.codeengine.appdomain.cloud/>
2. In **Your TechZone account**, type your account name, for example
   `itz-saas-390`. The page searches only the documents and tables of that
   account.

    ![Document search](../assets/screens/udi2/8-1a-search-page.png){ .screenshot }

### 8.2 Search the documents

1. In **Your question**, type `Why did a customer send back a tent?` (A).
   Click **Search documents** (B).

    ![Ask about the returned tent](../assets/screens/udi2/8-2a-tent-ask.png){ .screenshot }

**Check your progress:** the first passage comes from
**return_warranty_request_rma_30117.pdf**, the return form for the Trailhead
2P tent. The search matched by meaning: the form contains the word "tent" but
not the words "send back".

![The return form](../assets/screens/udi2/8-2b-tent-result.png){ .screenshot }

2. Replace the question with `Was anything damaged when the Ridgeline
   shipment reached Denver?` and click **Search documents**.

**Check your progress:** the passages come from the shipping documents. The
passage from **delivery_receipt_cfl_dr_558210.pdf** reads *"298 cartons in
good condition, 2 cartons damaged ... Two Basecamp 4P cartons on pallet 9
crushed at one corner"*.

![The delivery receipt](../assets/screens/udi2/8-2c-damage-result.png){ .screenshot }

### 8.3 Query the tables

1. Replace the question with `List each invoice with its vendor, total and due
   date` (A). Click **Ask the tables** (B).

    ![Ask the tables](../assets/screens/udi2/8-3a-owe-ask.png){ .screenshot }

**Check your progress:** **Query written by watsonx.ai** shows the SQL query
over your **invoice** table (A). The result (B) lists **Ridgeline Tent Co.**,
**33250**, due **2026-10-15**, and **Alpine Trail Footwear LLC**, **28480**,
due **2026-10-24**.

![Amounts and due dates](../assets/screens/udi2/8-3b-owe-result.png){ .screenshot }

2. Replace the question with `What reason did the customer give for returning
   the tent?` and click **Ask the tables**.

**Check your progress:** the query reads the **product_return_request**
table, which exists because you added the class in part 5 (A). The answer is
**Defective or broken** (B).

![The return reason](../assets/screens/udi2/8-3c-reason-result.png){ .screenshot }

A language model writes the SQL, so the query can vary between runs. The
values do not vary: they are the values extracted from the documents in
part 6.

## 9 Summary

You started with six scanned documents of unknown content. Without writing
code, you classified them, added a document class for a form that is
specific to Summit, extracted their fields into Iceberg tables, wrote their
text to Milvus as vectors, and answered questions from both outputs.

**Key takeaways**

**Documents become data** – Unstructured data curation reads scans and PDFs,
identifies the type of each document, and extracts the relevant fields into
Iceberg tables that any SQL engine can query.

**Your business, your document types** – The built-in classes cover common
business documents. A custom class, imported from a file or created in the
editor, covers document types that are specific to your business.

**Ready for AI and for analytics at once** – One processing run fills a
vector database for semantic search and generative AI, and the lakehouse for
reports and SQL, from the same governed source.

**No pipeline to hand-build** – Curation generates the processing flow and
its job. You can open, change and schedule the flow like any other flow in
the project.

## 10 Reference

- [Working with unstructured data in watsonx.data](https://www.ibm.com/docs/en/watsonxdata/saas?topic=data-working-unstructured)
- [Curating unstructured data](https://dataplatform.cloud.ibm.com/docs/content/wsj/curation/curation-unstructured.html?context=df)
