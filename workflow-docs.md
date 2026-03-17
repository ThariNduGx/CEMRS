# System Workflow Documentation

This document explains the core user journeys and system interactions for the Machinery Registration web application.

## 1. Public Access & Registration
- **Public Search**: Any user can navigate to the homepage (`index.html`) to search the **Third Schedule** (Approved Machinery Register) without logging in.
- **Account Creation**: Users who own construction machinery must navigate to the Registration page (`register.html`) and select their role (usually **Owner**).
- **Authentication**: After successful registration, the user is automatically logged in and redirected to their role-specific dashboard. Existing users can log in via `login.html`.

## 2. Rule 4 Workflow: Machinery Application (Owner Flow)
- **Dashboard Access**: Owners are directed to the **Owner Workspace** (`owner-dashboard.html`).
- **Fee Calculation**: The system automatically calculates the registration fee tier dynamically based on the number of machines the owner has already registered (e.g., Rs. 1000 for standard, reducing for fleet owners).
- **Submission**: The owner fills out the "Register Machinery" form, providing details like Type, Make/Model, and Location.
- **Documentation Upload**: The owner attaches mandatory documents:
  - Revenue License
  - Motor Traffic Registration Certificate
  - Affidavit
  - Engineer Report
- **Status Validation**: Upon submitting, the new application appears in the Owner's Status Board marked as **Pending**.

## 3. Rule 4 Workflow: Admin Review (Admin Flow)
- **Admin Access**: CIDA Officers (Admins) log in to their distinct **Officer Console** (`admin-dashboard.html`).
- **Processing Queue**: New applications appear in the "Pending Applications" table.
- **Verification**: Admins evaluate the submitted details and uploaded documents for accuracy to verify compliance with CIDA rules.
- **Decision Making**:
  - If compliant, the Admin clicks **Approve**.
  - If defective, the Admin clicks **Reject**, and they must provide a rejection reason (e.g., "Missing engineering report").

## 4. Rule 6 Workflow: Finalization & Certification
- **Approval Processing**: If approved, the system automatically:
  - Assigns a formal Registration Number (e.g., `CIDA-EX-2026-001`).
  - Sets an Expiry Date exactly one year from the registration date.
  - Updates the machine's status to **Approved**.
- **Digital Certificate Generation**: 
  - Owners immediately gain access to view and print their official Digital Certificate of Registration via their dashboard.
  - The record becomes searchable by the public dynamically.

## 5. Dispute Resolution Workflow
- **Notification**: If an application is rejected, the Owner's status board updates to **Rejected** along with the admin's provided reason.
- **Submit Appeal**: The Owner has the right to dispute the rejection by submitting an appeal justification via the dashboard.
- **Appeals Review**: Admins monitor the dedicated "Appeals Review" section in their console and make a final ruling.

## 6. Renewal & Audit Workflow
- **Renewal Triggers**: When an approved machine is exactly 30 days away from its expiration date, a **Renewal Notice** banner alerts the Owner upon logging in.
- **Renewal Initiation**: The Owner can quickly invoke the **Renew** action from their record matrix.
- **Analytics & Reporting**: Admins utilize the bottom section of their portal to monitor aggregate statistics (Total Registrations, Approvals, Rejections, Category breakdowns) and export those datasets to CSV or PDF for government audits.
