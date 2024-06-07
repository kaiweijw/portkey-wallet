export default {
  getFirstCryptoGift: {
    target: '/api/app/cryptogift/history/fist',
    config: { method: 'GET' },
  },
  getCryptoGiftHistories: {
    target: '/api/app/cryptogift/histories',
    config: { method: 'GET' },
  },
  getCryptoGiftDetail: {
    target: '/api/app/redpackage/detail',
    config: { method: 'GET' },
  },
  sendCryptoGift: {
    target: '/api/app/redpackage/send',
    config: { method: 'POST' },
  },
} as const;
