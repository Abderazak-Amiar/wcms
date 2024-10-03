import { v4 as uuidv4 } from 'uuid';

const uuid = uuidv4();

export const resolvers = {
  Query: {
    users: () => users,
    user: (parent, args) => {
      return users.find(
        (user) =>
          user.username === args.username && user.password === args.password,
      );

      return {};
    },
    consumers: () => consumers,
    consumer: (parent, args) => {
      // const res = consumers.find((consumer) => consumer.id == args.id);
      // return res;
    },
    counters: () => counters,
    counter: (parent, args) => {
      // return counters.find((counter) => counter.counterID == args.id);
    },
  },
  Consumer: {
    counters(parent) {
      // return counters.filter((c) => {
      //   return c.consumerID === parent.consumerID;
      // });
    },
  },
  Counter: {
    consumer(parent, args) {
      // return consumers.find((c) => c.consumerID === parent.consumerID);
    },
  },
  Mutation: {
    addConsumer(_, args) {
      let newConsumer = {
        ...args.consumer,
        id: Math.floor(Math.random() * 1000).toString(),
      };
      consumers.push(newConsumer);
      return newConsumer;
    },
    updateConsumer(_, args) {
      // let updatedConsumers = consumers.map((c) => {
      //   if (c.id == args.id) {
      //     return { ...c, ...args.edits };
      //   }
      //   return c;
      // });
      // return updatedConsumers.find((c) => c.id == args.id);
    },
    deleteConsumer(_, args) {
      // const data = consumers.filter((c) => c.id !== args.id);
      // return data;
    },
  },
};
