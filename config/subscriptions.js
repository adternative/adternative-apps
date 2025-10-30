module.exports = {
  defaultCurrency: 'USD',
  gracePeriodDays: 3,
  // Optional fallback pricing definitions. Prefer configuring pricing within each module's config.json.
  modules: {
    core: {
      label: 'Core Intelligence Suite',
      description: 'Sentiment monitoring, social listening, and connector automations.',
      monthly: {
        amount: 12900,
        currency: 'USD'
      },
      yearly: {
        amount: 129000,
        currency: 'USD'
      }
    },
    echo: {
      label: 'Echo Feedback Hub',
      description: 'Survey tools, testimonial capture, and customer feedback flows.',
      monthly: {
        amount: 7900,
        currency: 'USD'
      },
      yearly: {
        amount: 79000,
        currency: 'USD'
      }
    },
    flow: {
      label: 'Flow Campaign Manager',
      description: 'Creative asset workflow automation and paid media execution.',
      monthly: {
        amount: 15900,
        currency: 'USD'
      },
      yearly: {
        amount: 159000,
        currency: 'USD'
      }
    },
    pulse: {
      label: 'Pulse Messaging Suite',
      description: 'Email, SMS, and audience engagement toolkit.',
      monthly: {
        amount: 19900,
        currency: 'USD'
      },
      yearly: {
        amount: 199000,
        currency: 'USD'
      }
    },
    reverb: {
      label: 'Reverb Reputation Engine',
      description: 'Reputation monitoring and review management automations.',
      monthly: {
        amount: 10900,
        currency: 'USD'
      },
      yearly: {
        amount: 109000,
        currency: 'USD'
      }
    }
  }
};

