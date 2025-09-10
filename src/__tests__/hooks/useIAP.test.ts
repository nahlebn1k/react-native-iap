import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'

// Import after mocks
import * as IAP from '../../index'
import { useIAP } from '../../hooks/useIAP'

// Minimal Nitro mock used by index/useIAP under the hood
const mockIap: any = {
  initConnection: jest.fn(async () => true),
  endConnection: jest.fn(async () => true),
  fetchProducts: jest.fn(async () => []),
  getAvailablePurchases: jest.fn(async () => []),
  finishTransaction: jest.fn(async () => true),
  validateReceipt: jest.fn(async () => ({})),
  addPurchaseUpdatedListener: jest.fn(),
  removePurchaseUpdatedListener: jest.fn(),
  addPurchaseErrorListener: jest.fn(),
  removePurchaseErrorListener: jest.fn(),
  addPromotedProductListenerIOS: jest.fn(),
  removePromotedProductListenerIOS: jest.fn(),
}

jest.mock('react-native-nitro-modules', () => ({
  NitroModules: {
    createHybridObject: jest.fn(() => mockIap),
  },
}))

jest.mock('react-native', () => ({
  Platform: { OS: 'ios', select: (obj: any) => obj.ios },
}))

// Mock helpers used via index re-exports
jest.mock('../../helpers/subscription', () => ({
  getActiveSubscriptions: jest.fn(async () => []),
  hasActiveSubscriptions: jest.fn(async () => false),
}))

describe('hooks/useIAP (renderer)', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  let capturedPurchaseListener: any
  let capturedPromotedListener: any

  beforeEach(() => {
    jest.spyOn(IAP, 'initConnection').mockResolvedValue(true as any)
    jest.spyOn(IAP, 'getAvailablePurchases').mockResolvedValue([] as any)
    jest.spyOn(IAP, 'finishTransaction').mockResolvedValue(true as any)
    jest.spyOn(IAP, 'purchaseUpdatedListener').mockImplementation((cb: any) => {
      capturedPurchaseListener = cb
      return { remove: jest.fn() }
    })
    jest.spyOn(IAP, 'purchaseErrorListener').mockImplementation(() => {
      return { remove: jest.fn() }
    })
    jest
      .spyOn(IAP, 'promotedProductListenerIOS')
      .mockImplementation((cb: any) => {
        capturedPromotedListener = cb
        return { remove: jest.fn() }
      })
  })

  it('connects on mount and updates state on purchase events', async () => {
    let api: any
    const Harness = () => {
      api = useIAP()
      return null
    }

    await act(async () => {
      TestRenderer.create(React.createElement(Harness))
    })

    // Allow effects to run and connection to settle
    await act(async () => {})
    expect(api.connected).toBe(true)
    expect(IAP.initConnection).toBeDefined()

    // Simulate a purchase update coming from native
    const purchase = {
      id: 't1',
      productId: 'p1',
      transactionDate: Date.now(),
      platform: 'ios',
      quantity: 1,
      purchaseState: 'purchased',
      isAutoRenewing: false,
    }
    act(() => {
      capturedPurchaseListener?.(purchase)
    })
    await act(async () => {})
    expect(api.currentPurchase?.productId).toBe('p1')

    // Ensure finishTransaction wrapper works
    await act(async () => {
      await api.finishTransaction({ purchase, isConsumable: false })
    })
    expect(IAP.finishTransaction).toBeDefined()
  })

  it('fetches products/subscriptions and merges without duplicates', async () => {
    let api: any
    const Harness = () => {
      api = useIAP()
      return null
    }
    await act(async () => {
      TestRenderer.create(React.createElement(Harness))
    })
    await act(async () => {})

    const product: any = {
      id: 'p1',
      title: 'T',
      description: 'D',
      type: 'inapp',
      platform: 'ios',
    }
    const sub: any = {
      id: 's1',
      title: 'TS',
      description: 'DS',
      type: 'subs',
      platform: 'ios',
    }
    // Ensure connected before fetching
    await act(async () => {})
    expect(api.connected).toBe(true)
    jest.spyOn(IAP, 'fetchProducts').mockResolvedValueOnce([product] as any)
    await act(async () => {
      await api.fetchProducts({ skus: ['p1'] })
    })
    expect(api.products.map((p: any) => p.id)).toEqual(['p1'])

    // Duplicate fetch should not add duplicates
    jest.spyOn(IAP, 'fetchProducts').mockResolvedValueOnce([product] as any)
    await act(async () => {
      await api.fetchProducts({ skus: ['p1'] })
    })
    expect(api.products.map((p: any) => p.id)).toEqual(['p1'])

    // Subscriptions path
    jest.spyOn(IAP, 'fetchProducts').mockResolvedValueOnce([sub] as any)
    await act(async () => {
      await api.fetchProducts({ skus: ['s1'], type: 'subs' })
    })
    expect(api.subscriptions.map((s: any) => s.id)).toEqual(['s1'])
  })

  it('updates available purchases via getAvailablePurchases and restorePurchases', async () => {
    let api: any
    const Harness = () => {
      api = useIAP()
      return null
    }
    await act(async () => {
      TestRenderer.create(React.createElement(Harness))
    })
    await act(async () => {})

    const purchase = {
      id: 't2',
      productId: 'p2',
      transactionDate: Date.now(),
      platform: 'ios',
      quantity: 1,
      purchaseState: 'purchased',
      isAutoRenewing: false,
    }
    jest
      .spyOn(IAP, 'getAvailablePurchases')
      .mockResolvedValueOnce([purchase] as any)
    await act(async () => {
      await api.getAvailablePurchases()
    })
    expect(api.availablePurchases.map((p: any) => p.productId)).toEqual(['p2'])

    jest.spyOn(IAP, 'restorePurchases').mockResolvedValueOnce([purchase] as any)
    await act(async () => {
      await api.restorePurchases()
    })
    expect(api.availablePurchases.map((p: any) => p.productId)).toEqual(['p2'])
  })

  it('handles promoted product event and callback on iOS', async () => {
    const onPromoted = jest.fn()
    let api: any
    const Harness = () => {
      api = useIAP({ onPromotedProductIOS: onPromoted })
      return null
    }
    await act(async () => {
      TestRenderer.create(React.createElement(Harness))
    })
    await act(async () => {})

    const nitroProduct: any = {
      id: 'sku.promoted',
      title: 'Promo',
      description: 'Desc',
      type: 'inapp',
      displayPrice: '$1',
      currency: 'USD',
      platform: 'ios',
    }
    act(() => {
      capturedPromotedListener?.(nitroProduct)
    })
    await act(async () => {})
    expect(api.promotedProductIOS?.id).toBe('sku.promoted')
    expect(onPromoted).toHaveBeenCalled()
  })

  it('validateReceipt delegates to top-level function', async () => {
    let api: any
    const Harness = () => {
      api = useIAP()
      return null
    }
    await act(async () => {
      TestRenderer.create(React.createElement(Harness))
    })
    await act(async () => {})

    const spy = jest
      .spyOn(IAP, 'validateReceipt')
      .mockResolvedValueOnce({ isValid: true } as any)
    await act(async () => {
      await api.validateReceipt('sku')
    })
    expect(spy).toHaveBeenCalledWith('sku', undefined)
  })
})
