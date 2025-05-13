import { ApolloClient, gql, InMemoryCache } from '@apollo/client';
// uri: 'https://taourirt.abderazakamiar.com/graphql',
// uri: 'http://localhost:4000/graphql',
export const client = new ApolloClient({
  uri: 'http://localhost:4000/graphql',
  cache: new InMemoryCache(),
});

export const getUser = gql`
  query ($userName: String!, $password: String!) {
    userLogin(userName: $userName, password: $password) {
      message
      success
      data
    }
  }
`;

export const getUserByID = gql`
  query GetUserByID($userID: ID!) {
    getUserByID(userID: $userID) {
      userID
      userName
      role
    }
  }
`;

export const addCounter = gql`
  mutation ($counterID: ID!, $price: String!, $consumerID: ID!) {
    addCounter(counterID: $counterID, price: $price, consumerID: $consumerID) {
      counterID
    }
  }
`;
export const updateCounter = gql`
  mutation (
    $counterID: ID!
    $price: String!
    $status: String!
    $consumerID: ID!
  ) {
    updateCounter(
      counterID: $counterID
      price: $price
      status: $status
      consumerID: $consumerID
    ) {
      message
      success
    }
  }
`;
export const getCounters = gql`
  query {
    counters {
      counterID
      consumerID
      status
      createdAt
      price
      consumer {
        fullName
      }
    }
  }
`;
export const deleteCounters = gql`
  mutation ($counterIDs: [ID!]!) {
    deleteCounters(counterIDs: $counterIDs) {
      message
      success
    }
  }
`;

export const addConsumer = gql`
  mutation ($fullName: String!, $phone: String) {
    addConsumer(fullName: $fullName, phone: $phone) {
      consumerID
    }
  }
`;
export const updateConsumer = gql`
  mutation ($consumerID: ID!, $fullName: String!, $phone: String!) {
    updateConsumer(
      consumerID: $consumerID
      fullName: $fullName
      phone: $phone
    ) {
      consumerID
      fullName
      phone
    }
  }
`;

export const getConsumers = gql`
  query {
    consumers {
      consumerID
      fullName
      phone
      createdAt
      counters {
        counterID
        status
      }
    }
  }
`;
export const deleteConsumers = gql`
  mutation ($consumerIDs: [ID!]!) {
    deleteConsumers(consumerIDs: $consumerIDs) {
      message
      success
    }
  }
`;

export const addRecord = gql`
  mutation (
    $consumerID: ID!
    $counterID: ID!
    $newRecord: String!
    $period: String!
  ) {
    addRecord(
      consumerID: $consumerID
      counterID: $counterID
      newRecord: $newRecord
      period: $period
    ) {
      recordID
    }
  }
`;
export const updateRecord = gql`
  mutation (
    $recordID: ID!
    $consumerID: ID!
    $counterID: ID!
    $newRecord: String!
    $period: String!
  ) {
    updateRecord(
      recordID: $recordID
      consumerID: $consumerID
      counterID: $counterID
      newRecord: $newRecord
      period: $period
    ) {
      recordID
    }
  }
`;
export const GET_RECORD = gql`
  query GetRecord($recordID: ID!) {
    record(recordID: $recordID) {
      recordID
      consumer {
        fullName
      }
      oldRecord
      newRecord
      period
      createdAt
    }
  }
`;

export const addSettings = gql`
  mutation (
    $m3price: Float!
    $village: String!
    $phone: String
    $email: String
    $deadline: String!
  ) {
    addSettings(
      m3price: $m3price
      village: $village
      phone: $phone
      email: $email
      deadline: $deadline
    ) {
      m3price
      village
      phone
      email
      deadline
    }
  }
`;
export const getSettings = gql`
  query getSettings {
    getSettings {
      m3price
      village
      phone
      email
      deadline
    }
  }
`;

export const addPayment = gql`
  mutation ($consumerID: ID!, $invoiceID: String!, $paidAmount: Float!) {
    addPayment(
      consumerID: $consumerID
      invoiceID: $invoiceID
      paidAmount: $paidAmount
    ) {
      paymentID
    }
  }
`;

export const getDebtsByConsumer = gql`
  query getDebtsByConsumer($consumerID: ID!) {
    getDebtsByConsumer(consumerID: $consumerID) {
      debtID
      isPaid
      amount
      createdAt
      invoiceID
    }
  }
`;

export const UPDATE_INVOICE_PRINTED = gql`
  mutation UPDATE_INVOICE_PRINTED($invoiceID: String!) {
    updateInvoicePrinted(invoiceID: $invoiceID) {
      invoiceID
      isPrinted
    }
  }
`;
export const GET_INVOICES = gql`
  query GetInvoices {
    invoices {
      invoiceID
      createdAt
      amount
      isPaid
      isPrinted
      paymentCode
      consumer {
        consumerID
        fullName
      }
      record {
        recordID
        period
        recordDate
        nextRecordDate
        oldRecord
        newRecord
      }
      counter {
        counterID
        status
      }
      debt {
        isPaid
        amount
        createdAt
        invoiceID
      }
    }
  }
`;
export const GET_INVOICE = gql`
  query GetInvoice($invoiceID: ID!) {
    invoice(invoiceID: $invoiceID) {
      invoiceID
      createdAt
      amount
      isPaid
      isPrinted
      paymentCode
      recordID
      consumer {
        consumerID
        fullName
      }
      record {
        period
        recordDate
        nextRecordDate
        oldRecord
        newRecord
      }
      counter {
        counterID
        status
      }
      debt {
        isPaid
        amount
        createdAt
        invoiceID
      }
    }
  }
`;

export const DELETE_INVOICE = gql`
  mutation DeleteInvoice($invoiceID: ID!) {
    deleteInvoice(invoiceID: $invoiceID) {
      invoiceID
    }
  }
`;
export const UPDATE_INVOICE = gql`
  mutation UpdateInvoice(
    $invoiceID: ID!
    $amount: String!
    $paymentCode: String!
    $paymentDate: String
    $isPaid: Boolean!
    $isPrinted: Boolean!
  ) {
    updateInvoice(
      invoiceID: $invoiceID
      amount: $amount
      paymentCode: $paymentCode
      paymentDate: $paymentDate
      isPaid: $isPaid
      isPrinted: $isPrinted
    ) {
      invoiceID
      amount
      paymentCode
      paymentDate
      isPaid
      isPrinted
      updatedAt
    }
  }
`;

export const updateUser = gql`
  mutation updateUser(
    $userID: ID!
    $userName: String!
    $password: String
    $role: String!
  ) {
    updateUser(
      userID: $userID
      userName: $userName
      password: $password
      role: $role
    ) {
      message
      success
    }
  }
`;

export const addUser = gql`
  mutation addUser($userName: String!, $password: String!, $role: String!) {
    addUser(userName: $userName, password: $password, role: $role) {
      userID
    }
  }
`;

export const getUsers = gql`
  query GetUsers {
    users {
      userID
      userName
      role
      createdAt
    }
  }
`;
export const deleteUsers = gql`
  mutation DeleteUsers($userIDs: [ID!]!) {
    deleteUsers(userIDs: $userIDs) {
      message
      success
    }
  }
`;
