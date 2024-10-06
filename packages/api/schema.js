import { v1 as uuidv1 } from 'uuid';
import { db } from './db.js';
export const typeDefs = `#graphql
type User {
    userID: ID!
    userName: String!
    password: String!
    role: String!
    createdAt: String!
    UpdatedAt: String
}

type Counter {
    counterID: ID!
    status: String!
    price: Int!
    createdAt: String!
    updatedAt: String
    user: User!
    consumer: Consumer!
    }

type Consumer{
    consumerID: String!
    fullName: String!
    createdAt: String!
    updatedAt: String
    user: User
    counters: [Counter]
}

type Record {
    recordID: ID!
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
  invoiceID: ID!
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
  debtID: ID!
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
    user(userID:ID!):User
    userLogin(userName: String!, password: String!): User
    counters: [Counter]
    counter(id:ID!): Counter
    consumers: [Consumer] 
    consumer(consumerID:ID!): Consumer
}

type Mutation {
    addConsumer(fullName: String!):Consumer!
    updateConsumer(id: String, edits:updateConsumerInput):Consumer
    deleteConsumer(id:String!):[Consumer!]
}
input addConsumerInput {
    fullName: String!
}

input updateConsumerInput {
    fullName: String
    updatedAt: String
}
`;

export const resolvers = {
  Query: {
    users: () => {
      return new Promise((resolve, reject) => {
        db.serialize(() => {
          db.all(`SELECT * FROM user`, (err, row) => {
            if (err) {
              console.error(err.message);
              reject({});
            }
            resolve(row);
          });
        });
        db.close();
      });
    },
    consumers: () => {
      return new Promise((resolve, reject) => {
        db.serialize(() => {
          db.all(`SELECT * FROM consumer`, (err, row) => {
            console.log('==>row', row);
            if (err) {
              console.error(err.message);
              reject({});
            }
            resolve(row);
            console.log('==> resolve(row)', resolve(row));
          });
        });
        db.close();
      });
    },
    user: (parent, args) => {
      return new Promise((resolve, reject) => {
        db.serialize(() => {
          db.get(
            `SELECT * FROM user WHERE user.userID = '${args.userID}'`,
            (err, row) => {
              if (err) {
                console.error(err.message);
                reject({});
              }
              resolve(row);
            },
          );
        });
        db.close();
      });
    },
    userLogin: (parent, args) => {
      return new Promise((resolve, reject) => {
        db.serialize(() => {
          db.get(
            `SELECT * FROM user WHERE userName='${args.userName}' AND password='${args.password}'`,
            (err, row) => {
              if (err) {
                console.error(err.message);
                reject({});
              }
              resolve(row);
            },
          );
        });
        db.close();
      });
    },

    consumer: (parent, args) => {
      return new Promise((resolve, reject) => {
        db.serialize(() => {
          db.get(
            `SELECT * FROM consumer WHERE consumer.consumerID = '${args.consumerID}'`,
            (err, row) => {
              if (err) {
                console.error(err.message);
                reject({});
              }
              console.log('==>row', row);
              resolve(row);
            },
          );
        });
        db.close();
      });
    },
  },
  Mutation: {
    addConsumer(_, args) {
      let newConsumer = {
        consumerID: uuidv1(),
        createdAt: Date.now(),
        userID: '1',
        fullName: args.fullName,
      };
      console.log('==>newConsumer', newConsumer);
      console.log('==>uuidv1()', uuidv1());
      console.log('==>uuidv1()', typeof uuidv1());
      return new Promise((resolve, reject) => {
        db.serialize(function () {
          db.all(
            `INSERT INTO consumer (consumerID,fullName, createdAt, userID) VALUES(?,?,?,?) RETURNING consumerID`,
            [
              newConsumer.consumerID,
              newConsumer.fullName,
              newConsumer.createdAt,
              newConsumer.userID,
            ],

            async function (err, res) {
              if (err) {
                console.error(err.message);
                reject(err);
              }
              console.log('==>res', res);
              console.log('==>err', err);
              const consumerID = res[0].consumerID;
              resolve({ consumerID: consumerID });
            },
          );
        });
      });
    },
  },
};
// updateConsumer(_, args) {
//   // let updatedConsumers = consumers.map((c) => {
//   //   if (c.id == args.id) {
//   //     return { ...c, ...args.edits };
//   //   }
//   //   return c;
//   // });
//   // return updatedConsumers.find((c) => c.id == args.id);
// },
// deleteConsumer(_, args) {
//   // const data = consumers.filter((c) => c.id !== args.id);
//   // return data;
// },
