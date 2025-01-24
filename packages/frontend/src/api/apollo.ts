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

export const deleteConsumers = gql`
  mutation ($consumerId: [String!]!) {
    deleteConsumers(consumerIDs: $consumerId) {
      consumerID
    }
  }
`;

export const addCounter = gql`
  mutation ($counterID: String!, $price: String!, $consumerID: String!) {
    addCounter(counterID: $counterID, price: $price, consumerID: $consumerID) {
      counterID
    }
  }
`;
