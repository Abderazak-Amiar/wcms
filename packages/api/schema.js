import moment from 'moment';
import { customAlphabet } from 'nanoid';
import { Error } from 'sequelize';
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
    phone: String
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
  phone: String
  email: String
  deadline: String
  createdAt: String
  updatedAt: String
}
type ResponseMessage {
  success: Boolean!
  message: String!
  data: String
}

type Query {
    users: [User]
    user(userID: ID!): User
    userLogin(userName: String!, password: String!): ResponseMessage
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
    getUserByID(userID: ID!): User
}

type Mutation {
    addConsumer(fullName: String!, phone: String): Consumer!
    addPayment(consumerID: ID!, invoiceID:String!, paidAmount:Float!): Payment!
    addRecord(newRecord: String!, counterID: ID!, consumerID: ID!, period:String!): Record!
    updateRecord(recordID:ID!, newRecord: String!, counterID: ID!, consumerID: ID!, period:String!): Record!
    addCounter(counterID: ID!, consumerID: ID!, price: String!): Counter!
    updateConsumer(consumerID: ID!, fullName: String!, phone: String): Consumer
    updateCounter(counterID: ID!, status: String!, price: String!, consumerID:ID!): ResponseMessage
    deleteConsumers(consumerIDs: [ID!]!): ResponseMessage
    deleteCounters(counterIDs: [ID!]!): ResponseMessage
    deleteUsers(userIDs: [ID!]!): ResponseMessage
    addSettings(m3price: Float!, village: String!, phone: String, email:String, deadline: String!): Settings!
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
  updateUser(userID: ID!, userName: String, password: String, role: String): ResponseMessage
  addUser(userName: String!, password: String!, role: String!):User
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
            `SELECT userID, userName, role FROM user WHERE userName='${args.userName}' AND password='${args.password}'`,
            (err, row) => {
              if (err) {
                console.error(err.message);
                reject();
              }
              if (row) {
                resolve({
                  message: 'LoggedIn successfully',
                  success: true,
                  data: JSON.stringify(row),
                });
              }
              resolve({
                message: 'password or username is incorrect',
                success: false,
                data: JSON.stringify(row),
              });
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
    getUserByID: (_, { userID }) =>
      new Promise((resolve, reject) => {
        if (!db.open) return reject(new Error('Database is closed'));
        db.get(`SELECT * FROM user WHERE userID = ?`, [userID], (err, row) => {
          if (err) reject(err);
          resolve(row);
        });
      }),
  },

  Mutation: {
    addSettings: (_, { m3price, village, phone, email, deadline }) =>
      new Promise((resolve, reject) => {
        if (!db.open) return reject(new Error('Database is closed'));

        const updatedAt = new Date().toISOString();

        db.get(`SELECT * FROM settings LIMIT 1`, (err, row) => {
          if (err) return reject(err);

          if (row) {
            // Update existing settings
            db.run(
              `UPDATE settings SET m3price = ?, village = ?, updatedAt = ?, phone = ?, email = ?, deadline = ? WHERE rowid = (SELECT rowid FROM settings LIMIT 1)`,
              [
                parseFloat(m3price).toFixed(2),
                village,
                updatedAt,
                phone,
                email,
                deadline,
              ],
              function (err) {
                if (err) reject(err);
                resolve({
                  m3price,
                  village,
                  createdAt: row.createdAt, // Ensure createdAt is returned
                  updatedAt,
                  phone,
                  email,
                  deadline,
                });
              },
            );
          } else {
            // Insert new settings if it doesn't exist
            const createdAt = new Date().toISOString();
            db.run(
              `INSERT INTO settings (m3Price, village, createdAt, phone, email, deadline) VALUES (?, ?, ?, ?, ?, ?)`,
              [
                parseFloat(m3price).toFixed(2),
                village,
                createdAt,
                phone,
                email,
                deadline,
              ],
              function (err) {
                if (err) reject(err);
                resolve({
                  m3price,
                  village,
                  createdAt,
                  updatedAt: null,
                  phone,
                  email,
                  deadline,
                });
              },
            );
          }
        });
      }),

    addConsumer: (_, { fullName, phone }) =>
      new Promise((resolve, reject) => {
        if (!db.open) return reject(new Error('Database is closed'));

        const newConsumer = {
          consumerID: nanoid(),
          fullName: fullName.trim(),
          phone: phone.trim(),
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
              `INSERT INTO consumer (consumerID, fullName, phone, createdAt, userID) VALUES (?, ?, ?, ?, ?)`,
              [
                newConsumer.consumerID,
                newConsumer.fullName,
                newConsumer.phone,
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
    updateConsumer: (parent, args) => {
      return new Promise((resolve, reject) => {
        const fields = [];
        const values = [];

        if (args.fullName) {
          fields.push('fullName = ?');
          values.push(args.fullName);
        }

        if (args.phone) {
          fields.push('phone = ?');
          values.push(args.phone);
        }

        // No fields to update
        if (fields.length === 0) {
          return reject(new Error('No fields to update.'));
        }

        values.push(args.consumerID); // WHERE clause value

        const sql = `UPDATE consumer SET ${fields.join(
          ', ',
        )} WHERE consumerID = ?`;

        db.serialize(() => {
          db.run(sql, values, function (err) {
            if (err) {
              console.error(err.message);
              reject(new Error('Failed to update consumer.'));
            } else if (this.changes === 0) {
              reject(new Error('Consumer not found.'));
            } else {
              resolve({
                consumerID: args.consumerID,
                fullName: args.fullName || null,
                phone: args.phone || null,
              });
            }
          });
        });
      });
    },

    updateCounter: (parent, args) => {
      return new Promise((resolve, reject) => {
        db.serialize(() => {
          console.log(
            `🟢 Request to update counter ${args.counterID} for consumer ${args.consumerID} with status '${args.status}'`,
          );

          // Only check if we are updating TO "En Marche"
          if (args.status === 'En Marche') {
            db.get(
              `SELECT counterID FROM counter WHERE consumerID = ? AND status = 'En Marche' AND counterID != ?`,
              [args.consumerID, args.counterID],
              (err, row) => {
                if (err) {
                  console.error(
                    "❌ Database Error (Checking 'En Marche'):",
                    err.message,
                  );
                  reject(
                    new Error('Erreur lors de la vérification du compteur.'),
                  );
                } else if (row) {
                  console.warn(
                    `❌ Another counter (${row.counterID}) is already 'En Marche' for this consumer.`,
                  );
                  reject(
                    new Error(
                      'COUNTER EN MARCHE ALREADY EXISTS for this consumer',
                    ),
                  );
                } else {
                  // Proceed with updating the counter
                  db.run(
                    `UPDATE counter SET price = ?, status = ? WHERE counterID = ?`,
                    [args.price, args.status, args.counterID],
                    function (err) {
                      if (err) {
                        console.error(
                          '❌ Database Error (Updating Counter):',
                          err.message,
                        );
                        reject(
                          new Error('Échec de la mise à jour du compteur.'),
                        );
                      } else if (this.changes === 0) {
                        reject(new Error('Compteur introuvable.'));
                      } else {
                        resolve({
                          message: 'Compteur mis à jour avec succès',
                          success: true,
                        });
                      }
                    },
                  );
                }
              },
            );
          } else {
            // Directly update for statuses other than "En Marche"
            db.run(
              `UPDATE counter SET price = ?, status = ? WHERE counterID = ?`,
              [args.price, args.status, args.counterID],
              function (err) {
                if (err) {
                  console.error(
                    '❌ Database Error (Updating Counter):',
                    err.message,
                  );
                  reject(new Error('Échec de la mise à jour du compteur.'));
                } else if (this.changes === 0) {
                  reject(new Error('Compteur introuvable.'));
                } else {
                  resolve({
                    message: 'Compteur mis à jour avec succès',
                    success: true,
                  });
                }
              },
            );
          }
        });
      });
    },

    addPayment: (_, { consumerID, invoiceID, paidAmount }) =>
      new Promise((resolve, reject) => {
        if (!db) return reject(new Error('Database connection is unavailable'));

        // Step 1: Check if the invoice belongs to the given consumer
        db.get(
          `SELECT amount, isPaid, debtID, consumerID FROM invoice WHERE invoiceID = ?`,
          [invoiceID],
          (err, invoice) => {
            if (err) return reject(err);
            if (!invoice) return reject(new Error('Invoice not found'));

            // 🔥 Validate if the invoice belongs to the consumer
            if (invoice.consumerID !== consumerID) {
              return reject(
                new Error('Invoice does not belong to this consumer'),
              );
            }

            const { amount, isPaid, debtID } = invoice;

            // Step 2: Get total paid amount for the invoice
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

                // Step 3: Insert the payment
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

                    // Step 4: Mark invoice as paid (even for partial payment)
                    db.run(
                      `UPDATE invoice SET isPaid = 1, updatedAt = ? WHERE invoiceID = ?`,
                      [new Date().toISOString(), invoiceID],
                      (err) => {
                        if (err) return reject(err);

                        if (debtID) {
                          // If debt exists, update it
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

    addCounter: (_, args) => {
      console.log('==>args', args);

      return new Promise((resolve, reject) => {
        db.all(
          `SELECT status FROM counter WHERE consumerID = ?`,
          [args.consumerID],
          (err, rows) => {
            if (err) {
              console.error('Database Error:', err.message);
              return reject(
                new Error('Erreur lors de la vérification des compteurs.'),
              );
            }

            // Check if any counter is "En Marche"
            const hasActiveCounter = rows.some(
              (row) => row.status === 'En Marche',
            );

            if (hasActiveCounter) {
              return reject(new Error('ACTIVE_COUNTER_EXISTS'));
            }

            // Proceed with counter insertion
            const newCounter = {
              counterID: args.counterID,
              createdAt: new Date().toISOString(),
              userID: '1',
              price: args.price,
              consumerID: args.consumerID,
              status: 'En Marche', // New counter starts as "En Marche"
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
                if (err) {
                  console.error('Database Insert Error:', err.message);
                  return reject(
                    new Error("Erreur lors de l'ajout du compteur."),
                  );
                }
                resolve({ counterID: newCounter.counterID });
              },
            );
          },
        );
      });
    },

    addRecord: (_, { newRecord, counterID, consumerID, period, userID = 1 }) =>
      new Promise((resolve, reject) => {
        if (!db.open) return reject(new Error('Database is closed'));

        // Step 1: Check if an invoice already exists for this consumer and period
        db.get(
          `SELECT i.invoiceID 
           FROM invoice i
           JOIN record r ON i.recordID = r.recordID
           WHERE r.consumerID = ? AND r.period = ?`,
          [consumerID, period],
          (err, existingInvoice) => {
            if (err) return reject(err);

            if (existingInvoice) {
              return reject(
                new Error(
                  `INVOICE_EXISTS: An invoice already exists for this consumer and period.`,
                ),
              );
            }

            // Step 2: Get the last record for this consumer
            db.get(
              `SELECT * FROM record WHERE consumerID = ? ORDER BY recordDate DESC LIMIT 1`,
              [consumerID],
              (err, lastRecord) => {
                if (err) return reject(err);

                let oldRecord = 0;

                // Ensure oldRecord is the newRecord of the last inserted record
                if (lastRecord) {
                  oldRecord = lastRecord.newRecord;
                }

                const newRecordNumber = parseFloat(newRecord);
                const oldRecordNumber = parseFloat(oldRecord);

                if (newRecordNumber <= oldRecordNumber) {
                  return reject(
                    new Error(
                      `INVALID_RECORD: New record (${newRecord}) must be greater than the last recorded value (${oldRecord}).`,
                    ),
                  );
                }

                // Step 3: Always create a new record
                const recordID = nanoid();
                const createdAt = new Date().toISOString();
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

                const query = `INSERT INTO record 
                               (recordID, period, recordDate, nextRecordDate, oldRecord, newRecord, createdAt, updatedAt, counterID, consumerID, userID) 
                               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

                const params = Object.values(newRecordObj);

                db.run(query, params, function (err) {
                  if (err) return reject(err);

                  // Step 4: Fetch price settings
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
                      const paymentCode = `INV-${invoiceID.slice(0, 8)}`;

                      db.run(
                        `INSERT INTO invoice 
                       (invoiceID, amount, paymentCode, paymentDate, isPaid, isPrinted, createdAt, updatedAt, consumerID, debtID, recordID, userID) 
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                          invoiceID,
                          totalAmount.toFixed(2),
                          paymentCode,
                          null,
                          false,
                          false,
                          new Date().toISOString(),
                          updatedAt,
                          consumerID,
                          null, // debtID
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
          },
        );
      }),

    updateRecord: (
      _,
      { recordID, newRecord, counterID, consumerID, period, userID = 1 },
    ) =>
      new Promise((resolve, reject) => {
        if (!db.open) return reject(new Error('Database is closed'));

        const now = new Date().toISOString();
        const newReading = parseFloat(newRecord);

        const getRecordByID = () =>
          new Promise((res, rej) => {
            db.get(
              `SELECT * FROM record WHERE recordID = ?`,
              [recordID],
              (err, row) => (err ? rej(err) : res(row)),
            );
          });

        const getSettings = () =>
          new Promise((res, rej) => {
            db.get(`SELECT m3price FROM settings LIMIT 1`, [], (err, row) =>
              err ? rej(err) : res(row),
            );
          });

        const updateRecordInDB = () =>
          new Promise((res, rej) => {
            db.run(
              `UPDATE record SET 
                  newRecord = ?, updatedAt = ?, userID = ?, counterID = ?, consumerID = ?, period = ?
                 WHERE recordID = ?`,
              [
                newReading,
                now,
                userID,
                counterID,
                consumerID,
                period,
                recordID,
              ],
              (err) => (err ? rej(err) : res()),
            );
          });

        const updateInvoice = (record, totalAmount) =>
          new Promise((res, rej) => {
            db.run(
              `UPDATE invoice SET 
                  amount = ?, updatedAt = ?, consumerID = ?, userID = ?
                 WHERE recordID = ?`,
              [totalAmount.toFixed(2), now, consumerID, userID, recordID],
              (err) => (err ? rej(err) : res()),
            );
          });

        getRecordByID()
          .then((record) => {
            if (!record) {
              throw new Error(`Record with ID ${recordID} not found.`);
            }

            if (newReading <= record.oldRecord) {
              throw new Error(
                `INVALID_RECORD: New record (${newReading}) must be greater than the previous value (${record.oldRecord}).`,
              );
            }

            return updateRecordInDB().then(() =>
              getSettings().then((settings) => {
                if (!settings) throw new Error('Settings not found.');

                const consumption = newReading - record.oldRecord;
                const totalAmount = consumption * parseFloat(settings.m3price);

                const updatedRecord = {
                  ...record,
                  newRecord: newReading,
                  counterID,
                  consumerID,
                  period,
                  updatedAt: now,
                  userID,
                };

                return updateInvoice(updatedRecord, totalAmount).then(() =>
                  resolve(updatedRecord),
                );
              }),
            );
          })
          .catch((err) => reject(err));
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
        console.log('==> consumerIDs', consumerIDs);
        if (!db.open) return reject(new Error('Database is closed'));

        db.serialize(() => {
          db.run('BEGIN TRANSACTION');

          // Step 1: Delete related payments
          db.run(
            `DELETE FROM payment WHERE consumerID IN (${consumerIDs
              .map(() => '?')
              .join(', ')})`,
            consumerIDs,
            (err) => {
              if (err) return rollbackAndReject(err);
            },
          );

          // Step 2: Delete related debts
          db.run(
            `DELETE FROM debt WHERE consumerID IN (${consumerIDs
              .map(() => '?')
              .join(', ')})`,
            consumerIDs,
            (err) => {
              if (err) return rollbackAndReject(err);
            },
          );

          // Step 3: Delete related invoices
          db.run(
            `DELETE FROM invoice WHERE consumerID IN (${consumerIDs
              .map(() => '?')
              .join(', ')})`,
            consumerIDs,
            (err) => {
              if (err) return rollbackAndReject(err);
            },
          );

          // Step 4: Delete related records
          db.run(
            `DELETE FROM record WHERE consumerID IN (${consumerIDs
              .map(() => '?')
              .join(', ')})`,
            consumerIDs,
            (err) => {
              if (err) return rollbackAndReject(err);
            },
          );

          // Step 5: Delete related counters
          db.run(
            `DELETE FROM counter WHERE consumerID IN (${consumerIDs
              .map(() => '?')
              .join(', ')})`,
            consumerIDs,
            (err) => {
              if (err) return rollbackAndReject(err);
            },
          );

          // Step 6: Delete the consumers
          db.run(
            `DELETE FROM consumer WHERE consumerID IN (${consumerIDs
              .map(() => '?')
              .join(', ')})`,
            consumerIDs,
            function (err) {
              if (err) return rollbackAndReject(err);

              db.run('COMMIT', (err) => {
                if (err) return reject(err);
                resolve({
                  success: true,
                  message: 'Consommateurs supprimés avec succès',
                });
              });
            },
          );
        });

        function rollbackAndReject(error) {
          db.run('ROLLBACK', () => reject(error));
        }
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
            resolve({ success: true, message: 'Counters deleted' });
          },
        );
      }),
    deleteUsers: (_, { userIDs }) =>
      new Promise((resolve, reject) => {
        if (!db.open) return reject(new Error('Database is closed'));

        db.run(
          `DELETE FROM user WHERE userID IN (${userIDs
            .map(() => '?')
            .join(', ')})`,
          userIDs,
          function (err) {
            if (err) reject(err);
            resolve({ success: true, message: 'Users deleted' });
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
    addUser: (_, { userName, password, role }) =>
      new Promise((resolve, reject) => {
        if (!db.open) return reject(new Error('Database is closed'));
        const createdAt = new Date().toISOString();
        const userID = nanoid();
        const newUser = {
          userID: userID,
          userName: userName,
          role: role,
          password: password,
          createdAt: createdAt,
        };
        db.run(
          `INSERT INTO user (userID, userName, role, password, createdAt) VALUES(?,?,?,?,?)`,
          [
            newUser.userID,
            newUser.userName,
            newUser.role,
            newUser.password,
            newUser.createdAt,
          ],
          function (err) {
            if (err) return reject(err);
            resolve(newUser);
          },
        );
      }),
    updateUser: (_, { userID, userName, password, role }) =>
      new Promise((resolve, reject) => {
        if (!db.open) return reject(new Error('Database is closed'));

        const updatedAt = new Date().toISOString();

        db.run(
          `UPDATE user SET 
            userName = COALESCE(?, userName), 
            password = COALESCE(?, password), 
            role = COALESCE(?, role), 
            updatedAt = ? 
          WHERE userID = ?`,
          [userName, password, role, updatedAt, userID],
          function (err) {
            if (err) return reject(err.message);
            if (this.changes === 0) return reject(new Error('User not found'));

            db.get(`SELECT * FROM user WHERE userID = ?`, [userID], (err) => {
              if (err) return reject(err);
              resolve({
                success: true,
                message: 'Utilisateur mise à jour',
              });
            });
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
