import {render} from '@testing-library/react-native';
import SubscriptionFlow from '../../screens/SubscriptionFlow';
import * as RNIap from 'react-native-iap';

// Override the useIAP hook for this test
(RNIap.useIAP as jest.Mock).mockReturnValue({
  connected: true,
  products: [],
  subscriptions: [
    {
      type: 'subs',
      id: 'dev.hyo.martie.premium',
      title: 'Premium Subscription',
      description: 'Access all premium features',
      displayPrice: '$9.99/month',
      price: 9.99,
      currency: 'USD',
    },
  ],
  availablePurchases: [],
  activeSubscriptions: [],
  getProducts: jest.fn(),
  getAvailablePurchases: jest.fn().mockResolvedValue([]),
  getActiveSubscriptions: jest.fn().mockResolvedValue([]),
  requestPurchase: jest.fn(),
  requestSubscription: jest.fn(),
  finishTransaction: jest.fn(),
  fetchProducts: jest.fn(),
});

describe('SubscriptionFlow Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the screen title', () => {
    const {getByText} = render(<SubscriptionFlow />);
    expect(getByText('Subscription Flow')).toBeTruthy();
  });

  it('shows connection status when connected', () => {
    const {getByText} = render(<SubscriptionFlow />);
    expect(getByText('Store: ✅ Connected')).toBeTruthy();
  });

  it('displays available subscriptions', () => {
    const {getByText} = render(<SubscriptionFlow />);
    expect(getByText('Available Subscriptions')).toBeTruthy();
    expect(getByText('Premium Subscription')).toBeTruthy();
  });
});
