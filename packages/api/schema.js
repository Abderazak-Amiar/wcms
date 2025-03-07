import moment from 'moment';
import { v4 as uuid } from 'uuid';
import { db } from './db.js';
export const typeDefs = `#graphql
type User {
    userID: ID!
    userName: String!
    password: String!
    role: String!
    createdAt: String!
    updatedAt: String
}

type Counter {
    counterID: ID!
    consumerID: ID!
    status: String!
    price: String!
    createdAt: String!
    updatedAt: String
    user: User
    consumer: Consumer
}

type Consumer {
    consumerID: ID!
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
    oldRecord: String!
    newRecord: String!
    createdAt: String!
    updatedAt: String
    counter: Counter
    consumer: Consumer
}

type Invoice {
  invoiceID: ID!
  amount: String!
  paymentCode: String!
  paymentDate: String!
  isPaid: Boolean!
  isPrinted: Boolean!
  createdAt: String!
  updatedAt: String
  consumerID: ID!
  debtID: ID!
  recordID: ID!
  userID: ID!
}

type Debt {
  debtID: ID!
  amount: String!
  isPaid: Boolean!
  createdAt: String!
  updatedAt: String
  invoiceID: ID!
  consumerID: ID!
  userID: ID!
}

type Settings {
  m3Price: String!
  village: String!
  createdAt: String!
  updatedAt: String
}

type Query {
    users: [User]
    user(userID: ID!): User
    userLogin(userName: String!, password: String!): User
    counters: [Counter]
    counter(counterID: ID!): Counter
    consumers: [Consumer]
    consumer(consumerID: ID!): Consumer
    getInvoice(recordID: ID!): Invoice
}

type Mutation {
    addConsumer(fullName: String!): Consumer!
    addRecord(newRecord: String!, counterID: ID!, consumerID: ID!, period:String!): Record!
    addCounter(counterID: ID!, consumerID: ID!, price: String!): Counter!
    updateConsumer(consumerID: ID!, edits: updateConsumerInput!): Consumer
    deleteConsumers(consumerIDs: [ID!]!): [Consumer]
    deleteCounters(counterIDs: [ID!]!): [Counter]
    addSettings(m3Price: String!, village: String!): Settings!
    updateSettings(m3Price: String!, village: String!): Settings!
}

input updateConsumerInput {
    fullName: String
    updatedAt: String
}
`;

export const resolvers = {
  Query: {
    users: () =>
      new Promise((resolve, reject) => {
        if (!db.open) return reject(new Error('Database is closed'));
        db.all(`SELECT * FROM user`, (err, rows) => {
          console.log('==>rows', rows);
          if (err) reject(err);
          console.log('==>rows', rows);
          resolve(rows);
        });
      }),
    user: (parent, args) => {
      return new Promise((resolve, reject) => {
        db.serialize(() => {
          db.get(
            `SELECT * FROM user WHERE args.userID = '${args.userID}'`,
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
    consumers: () =>
      new Promise((resolve, reject) => {
        if (!db.open) return reject(new Error('Database is closed'));
        db.all(`SELECT * FROM consumer`, (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        });
      }),

    consumer: (_, { consumerID }) =>
      new Promise((resolve, reject) => {
        if (!db.open) return reject(new Error('Database is closed'));
        db.get(
          `SELECT * FROM consumer WHERE consumerID = ?`,
          [consumerID],
          (err, row) => {
            if (err) reject(err);
            resolve(row);
          },
        );
      }),

    counters: () =>
      new Promise((resolve, reject) => {
        if (!db.open) return reject(new Error('Database is closed'));
        db.all(`SELECT * FROM counter`, (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        });
      }),

    counter: (_, { counterID }) =>
      new Promise((resolve, reject) => {
        if (!db.open) return reject(new Error('Database is closed'));
        db.get(
          `SELECT * FROM counter WHERE counterID = ?`,
          [counterID],
          (err, row) => {
            if (err) reject(err);
            resolve(row);
          },
        );
      }),
    getInvoice: async (_, { recordID }) => {
      console.log('==>recordID', recordID);
      if (!db.open) throw new Error('Database is closed');

      return new Promise((resolve, reject) => {
        db.get(
          `SELECT r.*, s.m3Price, s.village 
             FROM record r 
             JOIN settings s ON 1=1 
             WHERE r.recordID = ?`,
          [recordID],
          (err, row) => {
            if (err) return reject(err);
            if (!row) return reject(new Error('Record not found'));

            const consumption = row.newRecord - row.oldRecord;
            const totalAmount = consumption * parseFloat(row.m3Price);

            resolve({
              recordID: row.recordID,
              consumerID: row.consumerID,
              counterID: row.counterID,
              period: row.period,
              recordDate: row.recordDate,
              oldRecord: row.oldRecord,
              newRecord: row.newRecord,
              consumption,
              totalAmount,
              m3Price: parseFloat(row.m3Price),
              village: row.village,
            });
          },
        );
      });
    },
  },

  Mutation: {
    addSettings: (_, { m3Price, village }) =>
      new Promise((resolve, reject) => {
        if (!db.open) return reject(new Error('Database is closed'));

        const updatedAt = new Date().toISOString();

        db.get(`SELECT * FROM settings LIMIT 1`, (err, row) => {
          if (err) return reject(err);

          if (row) {
            // Update existing settings
            db.run(
              `UPDATE settings SET m3Price = ?, village = ?, updatedAt = ? WHERE rowid = (SELECT rowid FROM settings LIMIT 1)`,
              [m3Price, village, updatedAt],
              function (err) {
                if (err) reject(err);
                resolve({
                  m3Price,
                  village,
                  createdAt: row.createdAt, // Ensure createdAt is returned
                  updatedAt,
                });
              },
            );
          } else {
            // Insert new settings if it doesn't exist
            const createdAt = new Date().toISOString();
            db.run(
              `INSERT INTO settings (m3Price, village, createdAt) VALUES (?, ?, ?)`,
              [m3Price, village, createdAt],
              function (err) {
                if (err) reject(err);
                resolve({ m3Price, village, createdAt, updatedAt: null });
              },
            );
          }
        });
      }),

    addConsumer: (_, { fullName }) =>
      new Promise((resolve, reject) => {
        if (!db.open) return reject(new Error('Database is closed'));

        const newConsumer = {
          consumerID: uuid(),
          fullName: fullName.trim(),
          createdAt: new Date().toISOString(),
          userID: '1',
        };

        db.get(
          `SELECT consumerID FROM consumer WHERE fullName = ?`,
          [newConsumer.fullName],
          (err, row) => {
            if (err) return reject(err);
            if (row) return reject(new Error('DUPLICATION'));

            db.run(
              `INSERT INTO consumer (consumerID, fullName, createdAt, userID) VALUES (?, ?, ?, ?)`,
              [
                newConsumer.consumerID,
                newConsumer.fullName,
                newConsumer.createdAt,
                newConsumer.userID,
              ],
              function (err) {
                if (err) reject(err);
                resolve(newConsumer);
              },
            );
          },
        );
      }),

    addCounter(_, args) {
      console.log('==>args', args);

      return new Promise((resolve, reject) => {
        db.get(
          `SELECT status FROM counter WHERE consumerID = ?`,
          [args.consumerID],
          (err, row) => {
            if (err) return reject(err);

            if (row) {
              if (row.status === 'En Marche') {
                return reject(new Error('ACTIVE_COUNTER_EXISTS'));
              }
              return reject(new Error('DUPLICATE_COUNTER_ID'));
            }

            // If no counter exists or all are not "En Marche", proceed with insertion
            const newCounter = {
              counterID: args.counterID,
              createdAt: new Date().toISOString(),
              userID: '1',
              price: args.price,
              consumerID: args.consumerID,
              status: 'En Marche',
            };

            db.run(
              `INSERT INTO counter (counterID, createdAt, userID, price, consumerID, status) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
              [
                newCounter.counterID,
                newCounter.createdAt,
                newCounter.userID,
                newCounter.price,
                newCounter.consumerID,
                newCounter.status,
              ],
              function (err) {
                if (err) return reject(err);
                resolve({ counterID: newCounter.counterID });
              },
            );
          },
        );
      });
    },

    addRecord: (_, { newRecord, counterID, consumerID, userID = 1 }) =>
      new Promise((resolve, reject) => {
        if (!db.open) return reject(new Error('Database is closed'));

        const period = 'Jan-March';

        db.get(
          `SELECT * FROM record WHERE period = ? AND consumerID = ?`,
          [period, consumerID],
          (err, row) => {
            if (err) return reject(err);

            const isUpdating = !!row;
            const recordID = isUpdating ? row.recordID : uuid();
            const oldRecord = isUpdating ? row.newRecord : 400; // Use the last newRecord as oldRecord
            const createdAt = isUpdating
              ? row.createdAt
              : new Date().toISOString();
            const updatedAt = new Date().toISOString();

            // **Check if newRecord is greater than oldRecord**
            if (newRecord <= oldRecord) {
              return reject(new Error(`INVALID_RECORD`));
            }

            const recordDate = moment().toISOString();
            const nextRecordDate = moment(recordDate)
              .add(3, 'months')
              .toISOString();

            const newRecordObj = {
              recordID,
              period,
              recordDate,
              nextRecordDate,
              oldRecord,
              newRecord,
              createdAt,
              updatedAt,
              counterID,
              consumerID,
              userID,
            };

            const query = isUpdating
              ? `UPDATE record 
                 SET recordDate = ?, nextRecordDate = ?, oldRecord = ?, 
                     newRecord = ?, updatedAt = ?, counterID = ?, consumerID = ?, userID = ? 
                 WHERE recordID = ?`
              : `INSERT INTO record 
                 (recordID, period, recordDate, nextRecordDate, oldRecord, newRecord, createdAt, updatedAt, counterID, consumerID, userID) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            const params = isUpdating
              ? [
                  newRecordObj.recordDate,
                  newRecordObj.nextRecordDate,
                  newRecordObj.oldRecord,
                  newRecordObj.newRecord,
                  newRecordObj.updatedAt,
                  newRecordObj.counterID,
                  newRecordObj.consumerID,
                  newRecordObj.userID,
                  newRecordObj.recordID,
                ]
              : Object.values(newRecordObj);

            db.run(query, params, function (err) {
              if (err) return reject(err);

              db.get(
                `SELECT m3price FROM settings LIMIT 1`,
                [],
                (err, settingsRow) => {
                  if (err) return reject(err);
                  if (!settingsRow)
                    return reject(new Error('Settings not found'));

                  const consumption =
                    newRecordObj.newRecord - newRecordObj.oldRecord;
                  const totalAmount =
                    consumption * parseFloat(settingsRow.m3price);
                  const invoiceID = uuid();
                  const debtID = uuid();
                  const paymentCode = `INV-${invoiceID.slice(0, 8)}`;

                  db.run(
                    `INSERT INTO invoice 
                   (invoiceID, amount, paymentCode, paymentDate, isPaid, isPrinted, createdAt, updatedAt, consumerID, debtID, recordID, userID) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                      invoiceID,
                      totalAmount.toFixed(2),
                      paymentCode,
                      null, // Payment date is initially null
                      false, // Not paid initially
                      false, // Not printed initially
                      new Date().toISOString(),
                      updatedAt,
                      consumerID,
                      debtID,
                      newRecordObj.recordID,
                      userID,
                    ],
                    function (err) {
                      if (err) return reject(err);
                      return resolve(newRecordObj);
                    },
                  );
                },
              );
            });
          },
        );
      }),

    deleteConsumers: (_, { consumerIDs }) =>
      new Promise((resolve, reject) => {
        if (!db.open) return reject(new Error('Database is closed'));

        db.run(
          `DELETE FROM consumer WHERE consumerID IN (${consumerIDs
            .map(() => '?')
            .join(', ')})`,
          consumerIDs,
          function (err) {
            if (err) reject(err);
            resolve(consumerIDs);
          },
        );
      }),

    deleteCounters: (_, { counterIDs }) =>
      new Promise((resolve, reject) => {
        if (!db.open) return reject(new Error('Database is closed'));

        db.run(
          `DELETE FROM counter WHERE counterID IN (${counterIDs
            .map(() => '?')
            .join(', ')})`,
          counterIDs,
          function (err) {
            if (err) reject(err);
            resolve(counterIDs);
          },
        );
      }),
  },
  Counter: {
    consumer: (parent) => {
      return new Promise((resolve, reject) => {
        db.get(
          `SELECT * FROM consumer WHERE consumerID = ?`,
          [parent.consumerID],
          (err, row) => {
            if (err) reject(err);
            resolve(row);
          },
        );
      });
    },
    user: (parent) => {
      return new Promise((resolve, reject) => {
        db.get(
          `SELECT * FROM user WHERE userID = ?`,
          [parent.userID],
          (err, row) => {
            if (err) reject(err);
            resolve(row);
          },
        );
      });
    },
  },
  Consumer: {
    user: (parent) => {
      return new Promise((resolve, reject) => {
        db.get(
          `SELECT * FROM user WHERE userID = ?`,
          [parent.userID],
          (err, row) => {
            if (err) reject(err);
            resolve(row);
          },
        );
      });
    },
    counters: (parent) => {
      return new Promise((resolve, reject) => {
        db.all(
          `SELECT * FROM counter WHERE consumerID = ?`,
          [parent.consumerID],
          (err, rows) => {
            if (err) reject(err);
            resolve(rows);
          },
        );
      });
    },
  },
};
