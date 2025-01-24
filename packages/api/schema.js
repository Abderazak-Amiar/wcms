import { v4 as uuid } from 'uuid';
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
    price: String!
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
    addCounter(counterID: String!, consumerID:String!, price:String!):Counter!
    updateConsumer(id: String, edits:updateConsumerInput):Consumer
    deleteConsumers(consumerIDs: [String!]!): [Consumer]
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
              reject();
            }
            resolve(row);
          });
        });
      });
    },
    consumers: () => {
      return new Promise((resolve, reject) => {
        db.serialize(() => {
          db.all(`SELECT * FROM consumer`, (err, row) => {
            console.log('==>row', row);
            if (err) {
              console.error(err.message);
              reject();
            }
            resolve(row);
            console.log('==> resolve(row)', resolve(row));
          });
        });
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
                reject();
              }
              resolve(row);
            },
          );
        });
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
                reject();
              }
              resolve(row);
            },
          );
        });
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
      });
    },
  },
  Mutation: {
    addConsumer(_, args) {
      let newConsumer = {
        consumerID: uuid(), // Manually generated ID
        createdAt: Date.now(),
        userID: '1', // Assuming a fixed userID for this example
        fullName: args.fullName,
      };

      return new Promise((resolve, reject) => {
        db.serialize(function () {
          db.run(
            `INSERT INTO consumer (consumerID, fullName, createdAt, userID) VALUES (?, ?, ?, ?)`,
            [
              newConsumer.consumerID,
              newConsumer.fullName,
              newConsumer.createdAt,
              newConsumer.userID,
            ],
            function (err) {
              if (err) {
                console.error(err.message);
                reject(err);
              } else if (this.changes === 0) {
                // No rows were inserted
                reject(new Error('Row insertion failed.'));
              } else {
                // Row was inserted successfully
                resolve({ consumerID: newConsumer.consumerID });
              }
            },
          );
        });
      });
    },
    addCounter(_, args) {
      console.log('==>args',args);
      let newCounter = {
        counterID: args.counterID, // Manually generated ID
        createdAt: Date.now(),
        userID: '1', // Assuming a fixed userID for this example
        price: args.price,
        consumerID: args.consumerID,
        status: 'En Marche',
      };

      return new Promise((resolve, reject) => {
        db.serialize(function () {
          db.run(
            `INSERT INTO counter (counterID, createdAt, userID, price, consumerID, status) VALUES (?, ?, ?, ?, ? ,?)`,
            [
              newCounter.counterID,
              newCounter.createdAt,
              newCounter.userID,
              newCounter.price,
              newCounter.consumerID,
              newCounter.status,
            ],
            function (err) {
              if (err) {
                console.error(err.message);
                reject(err);
              } else if (this.changes === 0) {
                // No rows were inserted
                reject(new Error('Row insertion failed.'));
              } else {
                // Row was inserted successfully
                resolve({ counterID: newCounter.counterID });
              }
            },
          );
        });
      });
    },
    updateConsumer(_, args) {
      const { consumerID, fullName, email, address } = args;
      return new Promise((resolve, reject) => {
        db.serialize(function () {
          const query = `UPDATE consumer SET fullName = ?, email = ?, address = ? WHERE consumerID = ?`;
          db.run(query, [fullName, email, address, consumerID], function (err) {
            if (err) {
              console.error(err.message);
              reject(err);
            } else if (this.changes === 0) {
              reject(new Error('Consumer not found with the provided ID.'));
            } else {
              resolve({
                consumerID,
                message: `Consumer with ID ${consumerID} updated successfully.`,
              });
            }
          });
        });
      });
    },
    deleteConsumers(_, { consumerIDs }) {
      return new Promise((resolve, reject) => {
        db.serialize(() => {
          const placeholders = consumerIDs.map(() => '?').join(', ');
          db.all(
            `SELECT * FROM consumer WHERE consumerID IN (${placeholders})`,
            consumerIDs,
            (err, rows) => {
              if (err) {
                console.error(err.message);
                reject(err);
                return;
              }
              if (!rows.length) {
                reject(new Error('No consumers found with the provided IDs.'));
                return;
              }
              db.run(
                `DELETE FROM consumer WHERE consumerID IN (${placeholders})`,
                consumerIDs,
                (err) => {
                  if (err) {
                    console.error(err.message);
                    reject(err);
                  } else {
                    console.log('==>rows', rows);
                    resolve(rows); // Return the deleted consumers' data
                  }
                },
              );
            },
          );
        });
      });
    },

    // deleteConsumers(_, { consumerIDs }) {
    //   return new Promise((resolve, reject) => {
    //     db.serialize(() => {
    //       const placeholders = consumerIDs.map(() => '?').join(', ');
    //       console.log('==>placeholders', placeholders);
    //       db.run(
    //         `DELETE FROM consumer WHERE consumerID IN (${placeholders})`,
    //         consumerIDs,
    //         function (err) {
    //           if (err) {
    //             console.error(err.message);
    //             reject(err);
    //           } else if (this.changes === 0) {
    //             reject(new Error('No consumers found with the provided IDs.'));
    //           } else {
    //             // Fetch deleted consumers to return them
    //             db.all(
    //               `SELECT * FROM consumer WHERE consumerID IN (${placeholders})`,
    //               consumerIDs,
    //               (err, rows) => {
    //                 if (err) {
    //                   console.error(err.message);
    //                   reject(err);
    //                 } else {
    //                   resolve(rows); // Return the deleted consumers' data
    //                 }
    //               },
    //             );
    //           }
    //         },
    //       );
    //     });
    //   });
    // },
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
