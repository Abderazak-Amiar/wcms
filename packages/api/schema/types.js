export const typeDefs = `#graphql
type User {
    id: ID!
    userName: String!
    password: String!
    role: String!
    createdAt: String!
    UpdatedAt: String
}

type Counter {
    id:ID!
    counterID: String!
    status: String!
    price: Int!
    createdAt: String!
    updatedAt: String
    user: User!
    consumer: Consumer!
    }

type Consumer{
    id: String
    consumerID: String!
    fullName: String!
    createdAt: String!
    updatedAt: String
    user: User!
    counters: [Counter!]
}

type Record {
    recordID: String!
    period: String!
    recordDate: String!
    nextRecordDate: String!
    oldRecord: String
    newRecord: String!
    createdAt: String!
    updatedAt: String
    counterID: String!
    consumerID: String!
    userID: String!
}

type invoice {
  invoiceID: String!
  amount: String!
  paymentCode: String!
  paymentDate: String!
  isPaid: String!
  isPrinted: String!
  createdAt: String!
  updatedAt: String
  consumerID: String!
  debtID: String!
  recordID: String!
  userID: String!
}

type debt {
  debtID: String!
  amount: String!
  isPaid: String!
  createdAt: String!
  updatedAt: String
  invoiceID: String!
  consumerID: String!
  userID: String!
}

type settings {
  m3Price: String!
  village: String!
  createdAt: String!
  updatedAt: String
}

type Query {
    users: [User]
    user(userName: String!, password: String!): User
    counters: [Counter]
    counter(id:ID!): Counter
    consumers: [Consumer] 
    consumer(id:String): Consumer
}

type Mutation {
    addConsumer(consumer: addConsumerInput):Consumer
    updateConsumer(id: String, edits:updateConsumerInput):Consumer
    deleteConsumer(id:String!):[Consumer!]
}
input addConsumerInput {
    consumerID: String!
    fullName: String!
    createdAt: String!
}

input updateConsumerInput {
    fullName: String
    updatedAt: String
}
`;