// Metro config with Sentry's additions, which let it match crash reports to source maps.
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

const config = getSentryExpoConfig(__dirname);

module.exports = config;
