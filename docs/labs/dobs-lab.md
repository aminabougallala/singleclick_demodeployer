---
title: "Lab: Agentic data observability, from monitoring to automated remediation"
---

# Lab: Agentic data observability, from monitoring to automated remediation

<!-- LAB-3079 -->

**Duration:** about 90 minutes

**Products:** watsonx.data integration (Data Observability, the batch and
streaming engines), Apache Airflow, IBM Bob

## 1 Introduction

A data pipeline that breaks without a visible error is more expensive than
one that stops with an error. When a nightly job fails and nobody is told,
the reports that depend on it show yesterday's numbers as if they were
today's. The data team usually hears about the problem from the people who
consume the data, hours or days later, and then spends most of its time
finding out which pipeline broke and why.

**Data Observability** in watsonx.data integration gives the data team one
place to watch every pipeline, whether it runs on the platform or outside it.
It raises an alert when a job fails or when one of its metrics leaves the
expected range, sends that alert to the tools the team already uses, and uses
AI to find the cause of a failure.

This lab has three parts, each one building on the previous one:

1. **Monitoring** (a streaming ingestion feed). You define a metric alert and
   send it to your team's on-call channel. The alert catches a problem that a
   job status cannot show.
2. **Automated root cause analysis** (a batch job). You let AI issue detection
   analyze a failed run and tell you what broke, instead of reading the log
   yourself.
3. **End-to-end automated remediation** (orchestration with Apache Airflow).
   You extend observability to a pipeline that runs outside the platform, and
   you hand its alert to an AI agent that finds the cause and repairs the
   pipeline.

### 1.1 Use case overview

**Summit Outfitters** is an online retailer of outdoor equipment. In this lab,
you are the data engineer at Summit Outfitters. You are responsible for three
pipelines, and each one breaks during the lab:

1. **The order feed (streaming).** A streaming job copies every order from the
   online store into a table that the finance team uses throughout the day.
   Today, the web team releases an update to the store that changes how an
   order total is formatted. Nobody tells the data team. The job keeps
   running, but the finance table rejects every new order.
2. **The supplier spend summary (batch).** A nightly batch job totals the
   supplier invoices for the finance team. Last night, the invoicing team
   renamed a column in the invoices table. The job now fails.
3. **The marketplace settlements (orchestration with Apache Airflow).** Summit
   Outfitters also sells through the TrailMart marketplace. An Apache Airflow
   pipeline on a server outside the platform loads TrailMart's daily sales
   every night. Last night, TrailMart changed its API. The pipeline finished
   successfully but loaded only a fraction of the day, and nothing in Airflow
   shows a problem.

Watch this video to see the whole story in action before you start: an alert
reaches the team, AI issue detection finds the cause, and an agent deploys
the fix.

<video controls preload="metadata" class="screenshot" style="width:100%;max-width:1000px"
  poster="../../assets/video/agentic-data-observability-demo-poster.jpg">
  <source src="../../assets/video/agentic-data-observability-demo.mp4" type="video/mp4">
  Your browser does not play embedded video.
  <a href="../../assets/video/agentic-data-observability-demo.mp4">Download the video</a>.
</video>

## 2 Getting started

!!! note "Before you start"
    **Keep every browser tab open.** The lab opens several tabs, and later
    steps return to tabs that you opened earlier. Do not close a tab unless a
    step tells you to.

    **How to read the screenshots.** A red box or a red arrow marks the
    element to click. When one screen needs several actions, the letters
    **A**, **B** and **C** give their order. Names and numbers in the
    screenshots, such as the account name or a job ID, differ from yours.

--8<-- "labs/_signin.md"

### 2.2 Create your task credentials

When you run a job in watsonx.data integration, the job runs with your **task
credentials**: an API key that the platform creates and stores for you. You
create the task credentials once.

1. In the top bar, click your profile picture (A), and then click **Profile
   and settings** (B).

    ![Profile and settings](../assets/screens/lab/2-4a-profile-menu.png){ .screenshot }

2. Click the **Task Credentials** tab.

    ![The Task Credentials tab](../assets/screens/lab/2-4b-settings.png){ .screenshot }

3. Click **Create task credential**.

    ![Create task credential](../assets/screens/lab/2-4c-task-credentials.png){ .screenshot }

4. In **Name**, type `techxchange-lab` (A), and then click **Create** (B).

    ![Name the task credential](../assets/screens/lab/2-4d-create-dialog.png){ .screenshot }

**Check your progress:** the table lists the task credential
**techxchange-lab** with a green status icon.

![The task credential is created](../assets/screens/lab/2-4e-credential-created.png){ .screenshot }

### 2.3 Open Data Observability

1. Click the **☰** menu in the upper-left corner (A). Click **Operations**
   (B), and then click **Data observability** (C).

    ![Operations, Data observability](../assets/screens/dobs/v4-2-3a-menu.png){ .screenshot }

2. If a welcome dialog opens, click **Continue**. The dialog opens only the
   first time.

    ![Welcome to Data Observability](../assets/screens/dobs/2-2b-welcome.png){ .screenshot }

3. The **Dashboard** opens. Read the three areas of the page:

    - **Observability coverage** (A) is the percentage of your jobs that have
      at least one alert definition or metric chart.
    - **Total triggered alerts** and **Open alerts** (B) count the alerts
      that were raised and the alerts that nobody has resolved yet.
    - **Issue detection powered by AI** (C) lists the issues that AI found in
      your job runs.

    The tabs above these areas, **Triggered alerts**, **Defined alerts** and
    **Alert receivers**, are where you work during the lab.

    ![The Data Observability dashboard](../assets/screens/dobs/v4-2-3c-dashboard.png){ .screenshot }

**Check your progress:** **Observability coverage** shows **0%**. None of
your jobs has an alert definition yet.

### 2.4 Open your team's on-call channel

!!! info "What an alert receiver is"
    An **alert receiver** is an external application to which Data
    Observability forwards alerts: email, Slack, Microsoft Teams, PagerDuty or
    a custom webhook. When you create an alert, you choose which receivers
    get it. Your team is then notified as soon as a problem occurs, without
    anyone watching a dashboard.

In this lab, the receiver is the Summit Outfitters data team's **on-call
channel**: a web page on which every alert appears as a card. The receiver
already exists in Data Observability under the name **Lab - alert viewer**.
You do not create a receiver in this lab. You only select **Lab - alert
viewer** when you create an alert.

1. Open <https://alert-webhook.23ij0n2ztu5p.ca-tor.codeengine.appdomain.cloud/>.

2. In the account box, type the name of your TechZone account, for example
   `itz-saas-351` (A). The name is in the top bar of the watsonx tab. Click
   **Open my channel** (B).

    ![Open your channel](../assets/screens/dobs/v4-2-4a-channel.png){ .screenshot }

3. Your channel opens. It shows the status **Listening** and no alerts yet.
   Every alert that you send to **Lab - alert viewer** appears on this page
   within about one minute of being triggered.

    ![The on-call channel](../assets/screens/dobs/v4-2-4b-listening.png){ .screenshot }

4. Return to the watsonx tab. In Data Observability, click the **Alert
   receivers** tab.

**Check your progress:** **Lab - alert viewer** is listed with the status
**Connected**.

![The receiver is connected](../assets/screens/dobs/d-2-3j-receivers-list.png){ .screenshot }

## 3 Monitoring with metrics and alerts (streaming ingestion feed)

The hardest streaming problem to detect is the one that produces no failure.
A job that stops with an error shows the status **Failed**, and anyone who
looks at it sees the problem. A job that receives data it cannot load keeps
the status **Running**: it reads every record, sends each one to error
handling, and writes nothing to its target. A monitoring tool that watches
only the job status reports that the job is healthy.

In this part, you watch a **metric** of the job instead of its status. The
metric counts the records that the job rejects, and an alert on it detects
the problem within minutes.

!!! info "Alerts, metrics and coverage"
    An **alert definition** is a rule that you attach to one or more jobs,
    for example "the status of this job is Failed" or "the metric
    `rows_loaded` of this job deviates from 1,000 by more than 40%". A
    **triggered alert** is one occurrence of a rule being met. The
    **observability coverage** on the dashboard is the percentage of your
    jobs that have at least one alert definition or metric chart.

### The ingestion feed

**Order feed - live** is a streaming job that runs on the streaming data
collector engine in your environment. It reads every order that the online
store places on the Kafka topic `shop.orders`, prepares the order in the
**Order amounts** stage, and writes it to the PostgreSQL table
`shop.orders_feed`. The finance team's revenue dashboard reads that table
during the day.

```mermaid
flowchart LR
  A[Online store] -->|new orders| B[(Kafka topic<br/>shop.orders)]
  B --> C["Order feed - live<br/>(streaming job)<br/>Order amounts stage"]
  C --> D[(PostgreSQL table<br/>shop.orders_feed)]
  D --> E[Finance revenue dashboard]
```

!!! info "How the feed reaches Data Observability"
    The streaming engine reports the metrics of every running job to Data
    Observability once a minute: the number of records read, the number
    written, the number sent to error handling, and others. In Data
    Observability, a streaming job is listed under its job name followed by
    its job ID, for example **Job for Order feed - live-01a174b4-...**. A
    metric alert compares the latest value of a metric with the condition
    that you define.

### 3.1 Create a metric alert for the ingestion feed

1. In Data Observability, click **New alert**.

    ![New alert](../assets/screens/dobs/v4-3-1a-new-alert.png){ .screenshot }

2. Click **Metric** (A), and then click **Next** (B).

    ![Metric](../assets/screens/dobs/v2-4-1b-metric-type.png){ .screenshot }

3. Click **Find a workspace** and select your project. Its name starts with
   `wxdi-auto-demo-`.

    ![Select your project](../assets/screens/dobs/v2-4-1c-workspace.png){ .screenshot }

4. Under **Asset**, click **Select asset**.

    ![Select asset](../assets/screens/dobs/v2-4-1d-select-asset.png){ .screenshot }

5. Click the job whose name starts with **Job for Order feed - live** (A).
   The metrics of the job appear with their latest values. Select
   **pipeline.batchErrorRecords.meter.m1_rate** (B). This metric is the
   number of records per second that the job sent to error handling during
   the last minute. Its value is 0 now. Click **Add assets** (C).

    ![The feed's error records metric](../assets/screens/dobs/v2-4-1e-pick-metric.png){ .screenshot }

6. Click **Next**.

7. Click **Fixed value** (A). In the **Operator** list, select **Greater
   than >** (B). In the box to the right, which carries the name of the
   metric, replace the value with `0.01` (C). The alert is then triggered as
   soon as the feed rejects records. Click **Next** (D).

    ![More than 0.01 rejected records per second](../assets/screens/dobs/v2-4-1h-condition.png){ .screenshot }

8. Turn on **Suppress repeated alerts** (A). A feed that keeps rejecting
   records then raises one alert instead of one alert every minute. Click
   **Critical** (B). In **Name**, type `Lab - Order feed rejecting orders`
   (C). Ignore the message that recommends a shorter name. Click **Next** (D).

    ![Severity and name](../assets/screens/dobs/v2-4-1i-details.png){ .screenshot }

9. Expand **Custom webhook** (A), select **Lab - alert viewer** (B), and then
   click **Create** (C).

    ![Send the alert to the on-call channel](../assets/screens/dobs/v2-4-1j-receivers.png){ .screenshot }

**Check your progress:** the **Defined alerts** tab lists **Lab - Order feed
rejecting orders** with **1 alert receiver**.

### 3.2 Release the website update

The web team now releases its update to the online store. After the update,
the store sends the order total as the text `84.10 USD` instead of the number
`84.10`. The web team does not tell the data team.

!!! warning "How this lab introduces the error"
    In a real company, the web team changes the store's code and ships the
    change through its own release process, for example from GitHub. The data
    platform is not involved, and the data team sees nothing until the data
    changes.

    To keep this lab inside your browser, without SSH access or a code
    repository, you play the part of the web team by running a small batch
    job named **Simulate a storefront website update**. The job itself does
    almost nothing: it generates one row. What matters is its **after-job
    subroutine**, a shell command that runs when the job finishes. The
    command writes a release marker on the server. The store's order
    generator checks for that marker, and from the moment it exists, every
    new order carries the order total as `84.10 USD`. From that moment, the
    ingestion feed receives orders in a format that the finance table cannot
    store.

1. Click the **☰** menu (A), click **Projects** (B), and then click **All
   projects** (C).

    ![All projects](../assets/screens/dobs/v4-3-2a-menu-projects.png){ .screenshot }

2. Click your project. Its name is **wxdi-auto-demo-** followed by eight
   characters.

    ![Open your project](../assets/screens/dobs/d-3-2b-open-project.png){ .screenshot }

3. Click the **Assets** tab (A). Under **Asset types**, click **Flows** (B),
   and then click **Simulate a storefront website update** (C).

    ![Open the website update flow](../assets/screens/dobs/v4-3-2c-open-flow.png){ .screenshot }

4. The flow opens on the canvas. Click the **Settings** icon in the toolbar,
   and then click **Before/after-job subroutines** (A). Read the **After-job
   subroutine** (B): it is the shell command that writes the release marker.
   Click **Cancel** to close the settings without changing them.

    ![The after-job subroutine](../assets/screens/dobs/v4-3-2d-subroutine.png){ .screenshot }

5. In the toolbar, click **Run**. After about 20 seconds, a banner shows
   **Run successful**. The website update is live.

    ![Run the website update](../assets/screens/dobs/v4-3-2e-run.png){ .screenshot }

**Check your progress:** the banner shows **Run successful**. Nothing visible
has changed on the order feed: its status is still **Running**.

### 3.3 Review the alert

1. Wait 2 to 3 minutes, and then switch to the on-call channel tab. The alert
   **Lab - Order feed rejecting orders** appears with its severity, the job
   and the value that triggered it, for example **0.06
   pipeline.batchErrorRecords.meter.m1_rate (threshold >0.01)**. Your team is
   notified without anyone opening the platform.

    ![The alert in the on-call channel](../assets/screens/dobs/v4-3-3a-channel-alert.png){ .screenshot }

2. Switch to the watsonx tab. In Data Observability, click **Triggered
   alerts** (A), and then click **Lab - Order feed rejecting orders** (B).

    ![Triggered alerts](../assets/screens/dobs/v4-3-3b-triggered.png){ .screenshot }

3. The alert details open. Click **Acknowledge** (A), so that your team sees
   that someone is working on the alert. Then click **See all log** (B) to
   open the job run that triggered the alert.

    ![Acknowledge and open the run](../assets/screens/dobs/v4-3-3c-acknowledge.png){ .screenshot }

4. The job run page opens in a new tab. **About this run** shows that the job
   is still **Running** (A). The **Real time summary** shows the number of
   input, output and error records: the error records count is increasing
   (B).

    ![The job run](../assets/screens/dobs/v4-3-3d-run-logs.png){ .screenshot }

5. Under **Associated flow**, click **Order feed - live**. The flow opens on
   its canvas with the job running (A). The **Real time summary** shows the
   error records (B), and the **Logs** panel lists one **ERROR** line per
   rejected order (C). Read one of them: *Can't coerce '84.10 USD' of type
   'STRING' to column 'order_total'*. The order total now arrives as text
   with a currency code, and the column `order_total` in the finance table
   accepts only numbers.

    ![The rejected orders](../assets/screens/dobs/v2-4-3c-feed-canvas.png){ .screenshot }

**Check your progress:** the job status is still **Running**. The metric
alert is the only thing that told you that the finance table stopped
receiving orders, and the error log tells you why.

### 3.4 Fix the ingestion feed

The store keeps sending the new format, so the feed must accept it. The
**Order amounts** stage prepares the order total before it is written to the
table. You change that stage so that it removes the currency code.

1. In the **Order feed - live** flow, click **Stop**. After a few seconds, the
   top bar shows **Job stopped**.

    ![The feed is stopped](../assets/screens/dobs/v4-3-4a-job-stopped.png){ .screenshot }

2. Click the **Order amounts** stage (A). The stage settings open. Under
   **Expressions**, the **Field expressions** list contains the output field
   `/order_total` with the expression `${record:value('/order_total')}`.
   Click the **edit** icon next to it (B).

    ![The Order amounts stage](../assets/screens/dobs/v4-3-4b-order-amounts.png){ .screenshot }

3. In the **Field expressions** window, select the whole **Field expression**
   (A) and replace it with the following expression. Then click **OK** (B).

    ```
    ${str:replace(record:value('/order_total'), ' USD', '')}
    ```

    ![The new expression](../assets/screens/dobs/v4-3-4c-expression.png){ .screenshot }

4. Click **Save** (A), and then click **Run** (B).

    ![Save and run](../assets/screens/dobs/v4-3-4d-save-run.png){ .screenshot }

5. In **Select offset**, keep **Continue from last-saved offset** selected and
   click **Start run**. The feed resumes from the last order that it loaded
   successfully, so no order is lost.

    ![Continue from the last offset](../assets/screens/dobs/v2-4-4d-run.png){ .screenshot }

**Check your progress:** the top bar shows **Job Running**. In the **Real time
summary**, the output count equals the input count, and the error records
count no longer increases. The orders that arrived while the feed was stopped
are loaded as well.

![The feed loads again](../assets/screens/dobs/v2-4-4e-fixed-running.png){ .screenshot }

### 3.5 Close the alert

1. Wait 2 minutes after the restart, so that the error records metric returns
   to 0.

2. In Data Observability, click **Triggered alerts**, click **Lab - Order
   feed rejecting orders**, and then click **Mark Resolved**.

    ![Resolve the alert](../assets/screens/dobs/v4-3-5a-resolve.png){ .screenshot }

**Check your progress:** the alert moves to **Resolved alerts**, and **Open
alerts** on the dashboard returns to 0.

Consider what this incident costs without the alert. From the moment of the
website update, the finance table rejects every order while the job reports
**Running**. The revenue dashboard stops increasing. The end-of-day revenue
figure, the reconciliation with the payment provider and the campaign
performance report are all computed from a table that is missing a day of
orders. The first person to notice is usually a finance analyst the next
morning, and the investigation starts from a wrong report, not from the job.
With the metric alert, the on-call engineer learns about the rejected orders
within minutes and repairs the feed before the first report is produced.

## 4 Automated root cause analysis (batch job)

In the first part, you found the cause of the problem yourself by reading
the error log. In this part, a batch job fails, and you let AI do that work.

!!! info "AI issue detection"
    For batch jobs, Data Observability analyzes every failed run with AI. It
    reads the run log, the design of the job and its own knowledge base,
    identifies the probable root cause, and proposes actions. The result
    appears on the dashboard under **Issue detection powered by AI** and in
    the details of the alert, so that the person who receives the alert also
    receives the diagnosis.

The finance team reviews the supplier spend summary every morning. The batch
job **Supplier spend - nightly** reads the previous night's invoices from the
PostgreSQL table `dobs_lab.supplier_invoices`, totals the amount per supplier
and category in the **Spend_KPIs** stage, and writes the result to
`dobs_lab.supplier_spend_summary`, the table behind the summary. Last night,
the invoicing team renamed a column in the invoices table. In this part, you
define an alert on the status of the job, run the job, and use AI issue
detection to identify the cause of the failure.

### 4.1 Create an alert on the job status

1. In Data Observability, click **New alert**.

    ![New alert](../assets/screens/dobs/3-1a-new-alert.png){ .screenshot }

2. Click **Job run state** (A), and then click **Next** (B).

    ![Job run state](../assets/screens/dobs/3-1b-alert-type.png){ .screenshot }

3. Under **Asset**, click **Select assets**.

    ![Select assets](../assets/screens/dobs/3-1c-select-assets.png){ .screenshot }

4. Under **Workspaces**, click your project.

    ![Select your project](../assets/screens/dobs/3-1d-workspace.png){ .screenshot }

5. Select **Supplier spend - nightly.DataStage job** (A), and then click
   **Add assets** (B).

    ![Select the nightly job](../assets/screens/dobs/3-1e-pick-job.png){ .screenshot }

    !!! info "Why the job is already listed"
        The list shows only jobs that have run at least once. The job ran
        once before the invoicing team's change, and that run succeeded.

6. Keep **Operator** set to **Equal to =** and **State** set to **Failed**
   (A). Click **Next** (B).

    ![Alert when a run fails](../assets/screens/dobs/3-1f-condition.png){ .screenshot }

7. Under **Severity**, click **Critical** (A). In **Name**, type
   `Lab - Supplier spend failed` (B). Leave **Suppress repeated alerts**
   turned off. Click **Next** (C).

    ![Severity and name](../assets/screens/dobs/3-1g-details.png){ .screenshot }

8. Expand **Custom webhook** (A), select **Lab - alert viewer** (B), and then
   click **Create** (C).

    ![Send the alert to the on-call channel](../assets/screens/dobs/v4-4-1h-receivers.png){ .screenshot }

**Check your progress:** the **Defined alerts** tab lists **Lab - Supplier
spend failed** and **Lab - Order feed rejecting orders**, each with **1 alert
receiver**. Click the **Dashboard** tab: **Observability coverage** is now
greater than 0%, because one of your batch jobs is observed.

![Two lab alerts defined](../assets/screens/dobs/v4-4-1i-defined.png){ .screenshot }

### 4.2 Run the nightly job

You run the nightly job yourself, as a data engineer does after a change,
instead of waiting for tonight's schedule.

1. Click the **☰** menu (A), click **Projects** (B), and then click **All
   projects** (C).

    ![All projects](../assets/screens/dobs/v4-3-2a-menu-projects.png){ .screenshot }

2. Click your project.

    ![Open your project](../assets/screens/dobs/d-3-2b-open-project.png){ .screenshot }

3. Click the **Assets** tab (A). Under **Asset types**, click **Flows** (B),
   and then click **Supplier spend - nightly** (C).

    ![Open the nightly flow](../assets/screens/dobs/v5-4-2a-open-flow-list.png){ .screenshot }

4. The flow opens on the canvas. It has three stages: the
   **Supplier_invoices** source, the **Spend_KPIs** aggregation and the
   **Supplier_spend_table** target.

    ![The flow on the canvas](../assets/screens/dobs/v4-4-2b-open-flow.png){ .screenshot }

5. In the toolbar, click **Run**. The flow is already compiled, so the run
   starts immediately.

    ![Run](../assets/screens/dobs/d-3-2e-run.png){ .screenshot }

6. After about 30 seconds, a red banner shows **Run failed**. Click **View
   log**.

    ![Run failed](../assets/screens/dobs/d-3-2f-run-failed.png){ .screenshot }

7. Scroll through the log. It contains hundreds of lines of engine output:
   environment settings, startup messages and errors from several stages.
   Nothing near the top of the log names the cause of the failure.

    ![The raw run log](../assets/screens/dobs/d-3-2g0-raw-log.png){ .screenshot }

8. In the **Find** box of the log, type `does not exist` (A) and press
   **Enter**. The error *column "amount" does not exist* appears at the far
   right of a long line, inside the SQL statement of a connector. It is one
   of 11 errors in this log.

    ![The error, found by searching](../assets/screens/dobs/d-3-2g-failure-log.png){ .screenshot }

    This is what troubleshooting looks like without observability. You must
    know that the job failed, open the right flow and its log, and know which
    text to search for. Even then, the log does not tell you that the
    invoicing team renamed a column, or who should fix it. Click the **X** to
    close the log.

### 4.3 Review the alert

1. Switch to the on-call channel tab. Within about one minute of the failure,
   **Lab - Supplier spend failed** appears with the trigger value **Failed**.

    ![The alert in the on-call channel](../assets/screens/dobs/v4-4-3a-channel-alert.png){ .screenshot }

2. Switch to the watsonx tab. In Data Observability, click **Triggered
   alerts** (A), and then click **Lab - Supplier spend failed** (B).

    ![Triggered alerts](../assets/screens/dobs/v4-4-3b-triggered.png){ .screenshot }

3. The alert details show the job, the run, and under **Detected issue** the
   diagnosis that AI produced. Click **Acknowledge**.

    ![Acknowledge](../assets/screens/dobs/v4-4-3c-acknowledge.png){ .screenshot }

### 4.4 Identify the cause with AI

1. Click the **Dashboard** tab (A). Under **Issue detection powered by AI**,
   click the issue for **Supplier spend - nightly.DataStage job**. Its
   description says that the column **'amount'** is missing from the table
   **'dobs_lab.supplier_invoices'** (B). AI writes the description, so its
   wording can differ from run to run.

    ![The detected issue](../assets/screens/dobs/v4-4-4a-ai-issue.png){ .screenshot }

2. Click **Start troubleshooting**.

    ![Start troubleshooting](../assets/screens/dobs/3-4b-ai-issue-panel.png){ .screenshot }

3. Wait about 20 seconds while AI analyzes the log, the flow and its
   knowledge base. Read the **Probable root cause** section.

    ![Probable root cause and recommended actions](../assets/screens/dobs/3-4c-ai-root-cause.png){ .screenshot }

**Check your progress:** the probable root cause names the missing **amount**
column in the SQL statement of the **Supplier_invoices** stage. The diagnosis
is correct: the invoicing team renamed **amount** to **amount_usd**.

!!! note "Check the recommendation before you apply it"
    **Recommended actions** suggests the column name `total_spend_usd`. That
    suggestion is wrong, because `total_spend_usd` is the alias that the
    query gives to its own result. The correct column is **amount_usd**. AI
    finds the cause in seconds, but you still verify the fix.

### 4.5 Fix the job

1. In the troubleshooting panel, under **Analyzing issue**, click **Go to
   flow**. The **Supplier spend - nightly** flow opens on its canvas.

    ![Go to flow](../assets/screens/dobs/v5-4-5a-go-to-flow.png){ .screenshot }

2. Double-click the **Supplier_invoices** stage.

    ![Open the source stage](../assets/screens/dobs/3-5b-double-click-source.png){ .screenshot }

3. Scroll to the **SQL** section. Find the **Select statement** field (A),
   and click the **Maximize** icon in its upper-right corner (B). The
   statement opens in the **Expression builder**.

    ![Open the SQL editor](../assets/screens/dobs/v4-4-5b-sql-editor-icon.png){ .screenshot }

4. In the editor, the statement contains `sum(amount)` (A). Change it to
   `sum(amount_usd)`, and then click **Apply and return** (B).

    ![The SQL statement in the Expression builder](../assets/screens/dobs/v4-4-5c-sql-fixed.png){ .screenshot }

5. Click **Save** at the bottom of the stage panel, and then click the
   **Compile** icon in the toolbar.

    ![Compile](../assets/screens/dobs/3-5e-compile.png){ .screenshot }

6. When the banner shows **Compile successful**, click **Run flow**.

    ![Run flow](../assets/screens/dobs/3-5f-run-flow.png){ .screenshot }

**Check your progress:** after about 20 seconds, the banner shows **Run
successful**, and 8 rows are written to **Supplier_spend_table**, one per
combination of supplier and category.

![Run successful](../assets/screens/dobs/3-5g-run-successful.png){ .screenshot }

### 4.6 Close the alert

1. In Data Observability, click **Triggered alerts**, click **Lab - Supplier
   spend failed**, and then click **Mark Resolved**.

    ![Mark resolved](../assets/screens/dobs/3-6b-mark-resolved.png){ .screenshot }

**Check your progress:** the alert moves to **Resolved alerts**, and **Open
alerts** on the dashboard returns to 0.

![The dashboard after the fix](../assets/screens/dobs/3-6c-dashboard-after.png){ .screenshot }

## 5 End-to-end automated remediation (orchestration with Apache Airflow)

In the first two parts, a person repaired the pipeline: you edited the feed,
and you corrected the SQL statement. In this part, an AI agent does the
repair, from the alert to the deployed fix, and you review its work.

This part also takes observability beyond the platform. Not every pipeline
runs on watsonx.data integration. The Summit Outfitters data team runs
**marketplace_settlements_daily** in its own Apache Airflow environment, on a
server outside the platform. The pipeline reports each run to Data
Observability, with the number of rows that it loaded, so it appears next to
the platform's own jobs, with the same alerts, the same receivers and the
same coverage figure.

Every night, the pipeline reads the previous day's sales from TrailMart's
partner API, page by page, and loads them into the table behind the daily
revenue report. On a normal night, it loads about 1,200 settlements. Last
night, TrailMart changed how its API pages through results. The pipeline
still reads the first page, finds no sign of a second page, and finishes
successfully. A run that loads 100 settlements instead of 1,200 is green in
Airflow. In this part, you detect the problem with a metric alert that
compares each run with a baseline, and an AI agent identifies the cause and
repairs the pipeline.

### 5.1 Create a metric alert for the pipeline

A fixed threshold worked for the ingestion feed, whose error rate must stay
at 0. The number of settlements varies from night to night, so this alert
compares each run with a **baseline** instead: a normal night loads about
1,000 settlements or more, and a deviation of more than 40% from that
baseline is not a normal night.

1. In Data Observability, click **New alert**.

2. Click **Metric** (A), and then click **Next** (B).

3. Click **Find a workspace** and select your project.

4. Under **Asset**, click **Select asset**.

5. Click **marketplace_settlements_daily** (A). Select **rows_loaded** (B).
   Its latest value is about 1,200: the number of settlements that the last
   nightly run loaded. Click **Add assets** (C).

    ![The rows_loaded metric](../assets/screens/dobs/v2-5-2e-pick-metric.png){ .screenshot }

6. Click **Next**.

7. Click **Percent deviation** (A). In **Metric baseline value**, replace the
   value with `1000` (B). In the **Percent deviation** box, replace the value
   with `40` (C). The message below the fields states the resulting range,
   600 to 1,400 rows, and how many of the previous runs fall outside it.
   Click **Next** (D).

    ![A 40% deviation from 1,000 rows](../assets/screens/dobs/v4-5-2h-condition.png){ .screenshot }

8. Click **Critical** (A). In **Name**, type
   `Lab - Marketplace settlements incomplete` (B). Ignore the message about
   the name length. Click **Next** (C).

    ![Severity and name](../assets/screens/dobs/v2-5-2i-details.png){ .screenshot }

9. Expand **Custom webhook** (A), select **Lab - alert viewer** (B), and then
   click **Create** (C).

    ![Send the alert to the on-call channel](../assets/screens/dobs/v4-5-2j-receivers.png){ .screenshot }

**Check your progress:** the **Defined alerts** tab lists three lab alerts.

![Three lab alerts defined](../assets/screens/dobs/v4-5-2k-defined.png){ .screenshot }

### 5.2 Open Airflow

Data Observability links every observed job to the system that runs it. You
open the Airflow environment from the alert that you just defined.

1. On the **Defined alerts** tab, click **Lab - Marketplace settlements
   incomplete**. The alert details open.

    ![The defined alert](../assets/screens/dobs/v4-5-1a-defined-row.png){ .screenshot }

2. Under **Asset details**, click the job name
   **Marketplace_settlements_daily**. Airflow opens in a new tab.

    ![The job links to Airflow](../assets/screens/dobs/v4-5-1b-airflow-link.png){ .screenshot }

3. On the Airflow **Sign In** page, type `admin` in **Username** (A) and
   `IBMDem0s1` in **Password** (B). Click **Sign In** (C).

    ![Sign in to Airflow](../assets/screens/dobs/5-1c-signin.png){ .screenshot }

4. Click **marketplace_settlements_daily**. The **Grid** view shows the runs
   of the previous nights. Every run is green, and each night loaded more than
   1,100 settlements.

    ![The marketplace pipeline's history](../assets/screens/dobs/v2-5-1d-history.png){ .screenshot }

**Check your progress:** every run in the grid is green. Do not change the
other DAGs in the list.

### 5.3 Run tonight's load

1. In Airflow, on the **marketplace_settlements_daily** page, click the
   **Trigger DAG** icon, a play button in the upper-right corner. A banner
   shows **Triggered marketplace_settlements_daily with new Run ID**.

    ![Trigger the load](../assets/screens/dobs/v2-5-3a-trigger.png){ .screenshot }

2. Wait about 30 seconds. The new run and all of its tasks turn green.

    ![The run succeeded](../assets/screens/dobs/v2-5-3b-green.png){ .screenshot }

**Check your progress:** in Airflow, the run is successful. Nothing on this
page indicates a problem.

### 5.4 Review the alert

1. Wait about 2 minutes, and then switch to the on-call channel tab. The
   alert **Lab - Marketplace settlements incomplete** appears with the
   trigger value **100 rows_loaded**.

    ![The alert in the on-call channel](../assets/screens/dobs/v4-5-4a-channel-alert.png){ .screenshot }

2. Switch to the watsonx tab. In Data Observability, click **Triggered
   alerts**, and then click **Lab - Marketplace settlements incomplete**. The
   trigger value reads **100 rows loaded (-90% from baseline)**: the run
   succeeded and loaded 100 settlements, compared with about 1,200 on each of
   the previous nights. Click **Acknowledge**.

    ![The triggered alert](../assets/screens/dobs/v4-5-4b-triggered.png){ .screenshot }

**Check your progress:** a successful run triggered an alert. An alert on the
job status alone would never have detected this problem.

### 5.5 Hand the incident to an AI agent

!!! info "How the agent sees what you see"
    Data Observability publishes its alerts, job runs and metrics through an
    **MCP server**. An AI agent that connects to it reads the same
    information that you reviewed: the alert, the run history of the pipeline
    and the values of `rows_loaded`. The Summit Outfitters data team uses
    **IBM Bob**, run as a headless agent, to triage the incidents that reach
    the on-call channel. With the information from Data Observability, the
    agent investigates the cause and proposes a fix as a pull request for a
    person to review.

!!! note "A recorded session"
    In this lab, the agent's work is a replay of a recorded IBM Bob session,
    filled in with the values of your alert. It does not change your
    environment.

1. In the on-call channel tab, on the card **Lab - Marketplace settlements
   incomplete**, click **Investigate with IBM Bob**.

    ![Investigate with IBM Bob](../assets/screens/dobs/v4-5-5a-investigate.png){ .screenshot }

2. Follow the session as it runs. Through the MCP server, the agent reads the
   alert, compares `rows_loaded` with the previous runs, reads the task log,
   calls TrailMart's API, and identifies the cause: TrailMart now pages its
   results with a cursor, and the pipeline stops after the first page.

    ![The agent's investigation](../assets/screens/dobs/v4-5-5b-session.png){ .screenshot }

3. Review the pull request that the agent opened. The change follows
   TrailMart's cursor to the last page, and it fails the task when fewer rows
   arrive than TrailMart reports, so that a partial load can never again
   finish successfully.

    ![The pull request](../assets/screens/dobs/v4-5-5c-pull-request.png){ .screenshot }

4. Click **Merge and deploy**. The session deploys the fix, runs the load
   again, and reports 1,216 settlements loaded.

    ![Deployed and resolved](../assets/screens/dobs/v4-5-5d-resolved.png){ .screenshot }

5. In Data Observability, open **Lab - Marketplace settlements incomplete**
   and click **Mark Resolved**.

**Check your progress:** on the **Dashboard**, **Open alerts** shows 0, and
**Observability coverage** has increased, because all three of your pipelines
are now observed.

![The dashboard at the end of the lab](../assets/screens/dobs/v4-5-5e-dashboard.png){ .screenshot }

## 6 Summary

In this lab, you observed three different pipelines from one place, detected
three different problems, and resolved each one. Each part added a level of
automation to the previous one.

**Monitoring.** Two of the three problems produced no failure. The ingestion
feed kept running while it rejected every order, and the marketplace pipeline
succeeded with a partial day. Metric alerts, on the records that a job rejects
and on the deviation of the rows that a pipeline loads, detected both within
minutes. Every alert reached the on-call channel within about one minute,
with the job, the severity and the value that triggered it. The same
notification can go to email, Slack, Microsoft Teams, PagerDuty or any
webhook.

**Automated root cause analysis.** For the batch job, AI issue detection read
the log and the flow and named the renamed column, so that the person who
received the alert also received the diagnosis.

**End-to-end automated remediation.** For the pipeline outside the platform,
an AI agent used Data Observability's MCP server to read the alert and the run
history, found the API change, proposed a tested fix, and deployed it after
your review.

**One view across environments.** A streaming job, a batch job and an Apache
Airflow pipeline on a server outside the platform report to one place. They
share the same alert definitions, the same alert receivers and one coverage
figure.

## 7 Reference

- [watsonx.data integration documentation](https://dataplatform.cloud.ibm.com/docs/content/wsj/getting-started/welcome-main.html?context=df)
- [Data Observability documentation](https://dataplatform.cloud.ibm.com/docs/content/dstage/dsnav/topics/data-observability.html?context=df)
- [Apache Airflow documentation](https://airflow.apache.org/docs/)
