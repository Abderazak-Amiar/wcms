import moment from 'moment';
import { customAlphabet } from 'nanoid';
import { db } from './db.js';
const nanoid = customAlphabet('1234567890abcdef', 8);

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
    debts:[Debt]
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
    counterID:ID!
    consumerID:ID!
    userID:ID!
    counter: Counter
    consumer: Consumer
    
}

type Invoice {
  invoiceID: ID!
  amount: String!
  paymentCode: String!
  paymentDate: String
  isPaid: Boolean!
  isPrinted: Boolean!
  createdAt: String!
  updatedAt: String
  consumerID: ID!
  debtID: ID
  recordID: ID!
  userID: ID!
  
  consumer: Consumer
  debt: Debt
  record: Record
  user: User
  counter: Counter
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
  invoice: Invoice
  consumer: Consumer
}

type Payment{
  paymentID: ID!
  paidAmount: Float!
  createdAt: String!
  updatedAt: String!
  invoiceID: ID!
  consumerID: ID!
  userID: ID!
}

type Settings {
  m3price: Float
  village: String
  createdAt: String
  updatedAt: String
}
type ResponseMessage {
  success: Boolean!
  message: String!
}

type Query {
    users: [User]
    user(userID: ID!): User
    userLogin(userName: String!, password: String!): User
    counters: [Counter]
    counter(counterID: ID!): Counter
    consumers: [Consumer]
    consumer(consumerID: ID!): Consumer
    invoices: [Invoice!]!
    invoice(invoiceID: ID!): Invoice
    getSettings: Settings
    getDebt(invoiceID: ID!): Debt
    getDebtsByConsumer(consumerID: ID!): [Debt]
    getDebts(consumerID: ID!): [Debt]
}

type Mutation {
    addConsumer(fullName: String!): Consumer!
    addPayment(consumerID: ID!, invoiceID:String!, paidAmount:Float!): Payment!
    addRecord(newRecord: String!, counterID: ID!, consumerID: ID!, period:String!): Record!
    addCounter(counterID: ID!, consumerID: ID!, price: String!): Counter!
    updateConsumer(consumerID: ID!, edits: updateConsumerInput!): Consumer
    deleteConsumers(consumerIDs: [ID!]!): [Consumer]
    deleteCounters(counterIDs: [ID!]!): [Counter]
    addSettings(m3price: String!, village: String!): Settings!
    updateSettings(m3Price: String!, village: String!): Settings!
    updateInvoicePrinted(invoiceID: String!): Invoice
    createInvoice(
    amount: Float!
    paymentCode: String!
    paymentDate: String
    isPaid: Boolean!
    isPrinted: Boolean!
    consumerID: ID!
    recordID: ID!
    debtID: ID!
    userID: ID!
  ): Invoice

  updateInvoice(
    invoiceID: ID!
    amount: Float
    paymentCode: String
    paymentDate: String
    isPaid: Boolean
    isPrinted: Boolean
  ): Invoice

  deleteInvoice(invoiceID: ID!): Invoice
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
              console.log('==>row', row);
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
    invoices: async () => {
      return new Promise((resolve, reject) => {
        db.all('SELECT * FROM invoice', [], (err, rows) => {
          if (err) reject(err);
          else
            resolve(
              rows.map((invoice) => ({
                ...invoice,
                isPaid: Boolean(invoice.isPaid), // Convert 0/1 to true/false
                isPrinted: Boolean(invoice.isPrinted), // Convert 0/1 to true/false
              })),
            );
        });
      });
    },
    invoice: async (_, { invoiceID }) => {
      return new Promise((resolve, reject) => {
        db.get(
          'SELECT * FROM invoice WHERE invoiceID = ?',
          [invoiceID],
          (err, row) => {
            if (err) reject(err);
            else {
              // Convert numeric 0/1 to Boolean true/false
              if (row) {
                row.isPaid = Boolean(row.isPaid);
                row.isPrinted = Boolean(row.isPrinted);
              }
              resolve(row);
            }
          },
        );
      });
    },
    getSettings: () =>
      new Promise((resolve, reject) => {
        if (!db.open) return reject(new Error('Database is closed'));

        db.get(`SELECT * FROM settings LIMIT 1`, [], (err, row) => {
          if (err) return reject(err);
          if (!row) return reject(new Error('Settings not found'));
          resolve(row);
        });
      }),
    getDebt: (_, { invoiceID }) => {
      return new Promise((resolve, reject) => {
        db.get(
          'SELECT * FROM debt WHERE invoiceID = ?',
          [invoiceID],
          (err, row) => {
            if (err) {
              console.error('Error fetching debt:', err);
              reject(err);
              return;
            }
            if (!row) {
              console.warn(`No debt found for invoice: ${invoiceID}`);
            }
            resolve(row);
          },
        );
      });
    },
    getDebtsByConsumer: (_, { consumerID }) => {
      console.log('Received consumerID:', consumerID); // Debug log
      return new Promise((resolve, reject) => {
        db.all(
          'SELECT * FROM debt WHERE consumerID = ?',
          [consumerID],
          (err, rows) => {
            // Fix: `row` should be `rows`
            if (err) {
              console.error('Error fetching debt:', err);
              reject(err);
              return;
            }
            if (!rows || rows.length === 0) {
              console.warn(`No debt found for consumer: ${consumerID}`);
            }
            resolve(rows); // Fix: Use `rows` instead of `row`
          },
        );
      });
    },

    getDebts: async (_, { consumerID }) => {
      return new Promise((resolve, reject) => {
        db.all(
          'SELECT * FROM debt WHERE consumerID = ?',
          [consumerID],
          (err, rows) => {
            if (err) {
              console.error('Error fetching debts:', err);
              reject(err);
              return;
            }
            if (!rows.length) {
              console.warn(`No debts found for consumer: ${consumerID}`);
            }
            resolve(rows);
          },
        );
      });
    },
  },

  Mutation: {
    addSettings: (_, { m3price, village }) =>
      new Promise((resolve, reject) => {
        if (!db.open) return reject(new Error('Database is closed'));

        const updatedAt = new Date().toISOString();

        db.get(`SELECT * FROM settings LIMIT 1`, (err, row) => {
          if (err) return reject(err);

          if (row) {
            // Update existing settings
            db.run(
              `UPDATE settings SET m3price = ?, village = ?, updatedAt = ? WHERE rowid = (SELECT rowid FROM settings LIMIT 1)`,
              [m3price, village, updatedAt],
              function (err) {
                if (err) reject(err);
                resolve({
                  m3price,
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
              [m3price, village, createdAt],
              function (err) {
                if (err) reject(err);
                resolve({ m3price, village, createdAt, updatedAt: null });
              },
            );
          }
        });
      }),

    addConsumer: (_, { fullName }) =>
      new Promise((resolve, reject) => {
        if (!db.open) return reject(new Error('Database is closed'));

        const newConsumer = {
          consumerID: nanoid(),
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
    addPayment: (_, { consumerID, invoiceID, paidAmount }) =>
      new Promise((resolve, reject) => {
        if (!db) return reject(new Error('Database connection is unavailable'));

        db.get(
          `SELECT amount, isPaid, debtID FROM invoice WHERE invoiceID = ?`,
          [invoiceID],
          (err, invoice) => {
            if (err) return reject(err);
            if (!invoice) return reject(new Error('Invoice not found'));

            const { amount, isPaid, debtID } = invoice;

            // Get total paid amount for the invoice
            db.get(
              `SELECT COALESCE(SUM(paidAmount), 0) as totalPaid FROM payment WHERE invoiceID = ?`,
              [invoiceID],
              (err, result) => {
                if (err) return reject(err);

                const totalPaid = result?.totalPaid || 0;
                const newTotalPaid = totalPaid + parseFloat(paidAmount);

                if (newTotalPaid > amount) {
                  return reject(
                    new Error('Total paid amount exceeds invoice amount'),
                  );
                }

                const remainingAmount = amount - newTotalPaid;
                const isFullyPaid = remainingAmount === 0;

                const newPayment = {
                  paymentID: nanoid(),
                  paidAmount: paidAmount.toFixed(2),
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  invoiceID,
                  consumerID,
                  userID: 1,
                };

                db.run(
                  `INSERT INTO payment (paymentID, paidAmount, createdAt, updatedAt, invoiceID, consumerID, userID) 
                         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                  [
                    newPayment.paymentID,
                    newPayment.paidAmount,
                    newPayment.createdAt,
                    newPayment.updatedAt,
                    newPayment.invoiceID,
                    newPayment.consumerID,
                    newPayment.userID,
                  ],
                  function (err) {
                    if (err) return reject(err);

                    // Mark invoice as paid (even for partial payment)
                    db.run(
                      `UPDATE invoice SET isPaid = 1, updatedAt = ? WHERE invoiceID = ?`,
                      [new Date().toISOString(), invoiceID],
                      (err) => {
                        if (err) return reject(err);

                        if (debtID) {
                          // If debt exists, update it instead of creating a new one
                          db.run(
                            `UPDATE debt SET amount = ?, isPaid = ?, updatedAt = ? WHERE invoiceID = ?`,
                            [
                              remainingAmount.toFixed(2),
                              isFullyPaid ? 1 : 0,
                              new Date().toISOString(),
                              invoiceID,
                            ],
                            (err) => {
                              if (err) return reject(err);
                              resolve({
                                ...newPayment,
                                remainingAmount,
                                isFullyPaid,
                                debtID,
                              });
                            },
                          );
                        } else if (!isFullyPaid) {
                          // If no debt exists, create it (only on first partial payment)
                          const newDebtID = nanoid();
                          db.run(
                            `INSERT INTO debt (debtID, invoiceID, consumerID, amount, createdAt, userID, isPaid) 
                                   VALUES (?, ?, ?, ?, ?, ?, 0)`,
                            [
                              newDebtID,
                              invoiceID,
                              consumerID,
                              remainingAmount.toFixed(2),
                              new Date().toISOString(),
                              1,
                            ],
                            (err) => {
                              if (err) return reject(err);
                              db.run(
                                `UPDATE invoice SET debtID = ? WHERE invoiceID = ?`,
                                [newDebtID, invoiceID],
                                (err) => {
                                  if (err) return reject(err);
                                  resolve({
                                    ...newPayment,
                                    remainingAmount,
                                    isFullyPaid: false,
                                    debtID: newDebtID,
                                  });
                                },
                              );
                            },
                          );
                        } else {
                          // Fully paid, no debt update needed
                          resolve({
                            ...newPayment,
                            remainingAmount: 0,
                            isFullyPaid: true,
                          });
                        }
                      },
                    );
                  },
                );
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
            if (err) return reject({ message: 'Azul' });

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

    addRecord: (_, { newRecord, counterID, consumerID, period, userID = 1 }) =>
      new Promise((resolve, reject) => {
        console.log('==> counterID', counterID);
        if (!db.open) return reject(new Error('Database is closed'));

        // Get the last record for the given consumerID
        db.get(
          `SELECT * FROM record WHERE consumerID = ? ORDER BY recordDate DESC LIMIT 1`,
          [consumerID],
          (err, lastRecord) => {
            if (err) return reject(err);

            let isUpdating = false;
            let oldRecord = 0;

            if (lastRecord) {
              oldRecord = lastRecord.newRecord;

              if (lastRecord.period === period) {
                // If the period is the same, update the record if newRecord is greater
                if (newRecord > oldRecord) {
                  isUpdating = true;
                } else {
                  return reject(
                    new Error(
                      `INVALID_RECORD: New record must be greater than the last record for the same consumer.`,
                    ),
                  );
                }
              }
            }

            // Prepare new record data
            const recordID = isUpdating ? lastRecord.recordID : nanoid();
            const createdAt = isUpdating
              ? lastRecord.createdAt
              : new Date().toISOString();
            const updatedAt = new Date().toISOString();
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

            console.log('==> newRecordObj', newRecordObj);

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

              // Fetch settings after successfully inserting/updating the record
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
                  const invoiceID = nanoid();
                  const debtID = null;
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

    updateInvoice: async (
      _,
      { invoiceID, amount, paymentCode, paymentDate, isPaid, isPrinted },
    ) => {
      const updatedAt = new Date().toISOString();

      return new Promise((resolve, reject) => {
        db.run(
          `UPDATE invoice SET 
                amount = COALESCE(?, amount), 
                paymentCode = COALESCE(?, paymentCode), 
                paymentDate = COALESCE(?, paymentDate), 
                isPaid = COALESCE(?, isPaid), 
                isPrinted = COALESCE(?, isPrinted), 
                updatedAt = ? 
              WHERE invoiceID = ?`,
          [
            amount,
            paymentCode,
            paymentDate,
            isPaid,
            isPrinted,
            updatedAt,
            invoiceID,
          ],
          function (err) {
            if (err) reject(err);
            else {
              db.get(
                'SELECT * FROM invoice WHERE invoiceID = ?',
                [invoiceID],
                (err, row) => {
                  if (err) reject(err);
                  else resolve(row);
                },
              );
            }
          },
        );
      });
    },
    deleteInvoice: async (_, { invoiceID }) => {
      return new Promise((resolve, reject) => {
        db.get(
          'SELECT * FROM invoice WHERE invoiceID = ?',
          [invoiceID],
          (err, invoice) => {
            if (err) {
              reject(err);
            } else if (!invoice) {
              reject(new Error('Invoice not found'));
            } else {
              // Step 1: Delete related payments
              db.run(
                'DELETE FROM payment WHERE invoiceID = ?',
                [invoiceID],
                function (err) {
                  if (err) {
                    reject(err);
                  } else {
                    // Step 2: Delete related debts
                    db.run(
                      'DELETE FROM debt WHERE invoiceID = ?',
                      [invoiceID],
                      function (err) {
                        if (err) {
                          reject(err);
                        } else {
                          // Step 3: Delete the related record (if applicable)
                          db.run(
                            'DELETE FROM record WHERE recordID = ?',
                            [invoice.recordID],
                            function (err) {
                              if (err) {
                                reject(err);
                              } else {
                                // Step 4: Delete the invoice itself
                                db.run(
                                  'DELETE FROM invoice WHERE invoiceID = ?',
                                  [invoiceID],
                                  function (err) {
                                    if (err) reject(err);
                                    else resolve(invoice); // Return the deleted invoice
                                  },
                                );
                              }
                            },
                          );
                        }
                      },
                    );
                  }
                },
              );
            }
          },
        );
      });
    },

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
    updateInvoicePrinted: async (_, { invoiceID }) => {
      try {
        if (!db) throw new Error('Database connection not established');

        const result = await db.run(
          `UPDATE invoice SET isPrinted = 1 WHERE invoiceID = ?`,
          [invoiceID],
        );

        if (result.changes === 0) {
          throw new Error('Failed to update invoice');
        }

        return { invoiceID, isPrinted: true };
      } catch (error) {
        console.error('Error updating invoice:', error);
        throw new Error('Failed to update invoice');
      }
    },
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
    debts: async (parent) => {
      return new Promise((resolve, reject) => {
        db.all(
          `SELECT * FROM debt WHERE consumerID = ?`,
          [parent.consumerID],
          (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
          },
        );
      });
    },
  },
  Invoice: {
    consumer: ({ consumerID }) => {
      return new Promise((resolve, reject) => {
        db.get(
          'SELECT * FROM consumer WHERE consumerID = ?',
          [consumerID],
          (err, row) => {
            if (err) reject(err);
            resolve(row);
          },
        );
      });
    },

    debt: ({ debtID }) => {
      return new Promise((resolve, reject) => {
        db.get('SELECT * FROM debt WHERE debtID = ?', [debtID], (err, row) => {
          if (err) reject(err);
          resolve(row);
        });
      });
    },

    record: ({ recordID }) => {
      return new Promise((resolve, reject) => {
        db.get(
          'SELECT * FROM record WHERE recordID = ?',
          [recordID],
          (err, row) => {
            if (err) reject(err);
            resolve(row);
          },
        );
      });
    },

    user: ({ userID }) => {
      return new Promise((resolve, reject) => {
        db.get('SELECT * FROM user WHERE userID = ?', [userID], (err, row) => {
          if (err) reject(err);
          resolve(row);
        });
      });
    },
    counter: ({ recordID }) => {
      return new Promise((resolve, reject) => {
        db.get(
          'SELECT counter.* FROM counter INNER JOIN record ON counter.counterID = record.counterID WHERE record.recordID = ?',
          [recordID],
          (err, row) => {
            if (err) reject(err);
            resolve(row);
          },
        );
      });
    },
  },
  Debt: {
    invoice: ({ invoiceID }) => {
      return new Promise((resolve, reject) => {
        db.get(
          'SELECT * FROM invoice WHERE invoiceID = ?',
          [invoiceID],
          (err, row) => {
            if (err) {
              console.error('Error fetching invoice:', err);
              reject(err);
              return;
            }
            if (!row) {
              console.warn(`No invoice found for invoiceID: ${invoiceID}`);
            }
            resolve(row);
          },
        );
      });
    },
    consumer: ({ consumerID }) => {
      return new Promise((resolve, reject) => {
        db.get(
          'SELECT * FROM consumer WHERE consumerID = ?',
          [consumerID],
          (err, row) => {
            if (err) {
              console.error('Error fetching consumerID:', err);
              reject(err);
              return;
            }
            if (!row) {
              console.warn(`No invoice found for consumer: ${consumerID}`);
            }
            resolve(row);
          },
        );
      });
    },
  },

  Record: {
    counter: ({ counterID }) => {
      return new Promise((resolve, reject) => {
        db.get(
          'SELECT * FROM counter WHERE counterID = ?',
          [counterID],
          (err, row) => {
            if (err) reject(err);
            resolve(row);
          },
        );
      });
    },
  },
};
