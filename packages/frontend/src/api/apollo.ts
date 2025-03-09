import { ApolloClient, gql, InMemoryCache } from '@apollo/client';
export const client = new ApolloClient({
  uri: 'http://localhost:4000/graphql',
  cache: new InMemoryCache(),
});

export const getUser = gql`
  query ($userName: String!, $password: String!) {
    userLogin(userName: $userName, password: $password) {
      userID
      userName
    }
  }
`;
export const getConsumers = gql`
  query {
    consumers {
      consumerID
      fullName
      createdAt
      counters {
        counterID
        status
      }
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

export const addConsumer = gql`
  mutation ($fullName: String!) {
    addConsumer(fullName: $fullName) {
      consumerID
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
export const addSettings = gql`
  mutation ($m3Price: String!, $village: String!) {
    addSettings(m3Price: $m3Price, village: $village) {
      m3Price
      village
      createdAt
    }
  }
`;
export const getSettings = gql`
  query getSettings {
    getSettings {
      m3price
      village
    }
  }
`;
export const deleteConsumers = gql`
  mutation ($consumerId: [String!]!) {
    deleteConsumers(consumerIDs: $consumerId) {
      consumerID
    }
  }
`;
export const deleteCounters = gql`
  mutation ($counterId: [String!]!) {
    deleteCounters(counterIDs: $counterId) {
      counterId
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

export const GET_INVOICES = gql`
  query GetInvoices {
    invoices {
      invoiceID
      createdAt
      amount
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
export const GET_INVOICE = gql`
  query GetInvoice($invoiceID: ID!) {
    invoice(invoiceID: $invoiceID) {
      invoiceID
      amount
      paymentCode
      paymentDate
      isPaid
      isPrinted
      createdAt
    }
  }
`;
