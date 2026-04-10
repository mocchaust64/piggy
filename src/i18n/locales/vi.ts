import type { TranslationKeys } from './en'

const vi: TranslationKeys = {
  app: {
    name: 'Vàng Heo Đất',
    tagline: 'Tiết kiệm vàng cho con yêu',
  },

  auth: {
    signInWithApple: 'Đăng nhập với Apple',
    signInWithEmail: 'Đăng nhập bằng email',
    emailPlaceholder: 'Nhập email của bạn',
    sendOtp: 'Gửi mã xác nhận',
    otpPlaceholder: 'Nhập mã 6 số',
    verifyOtp: 'Xác nhận',
    otpSent: 'Mã xác nhận đã được gửi đến email của bạn',
    loginError: 'Đăng nhập thất bại, vui lòng thử lại',
  },

  onboarding: {
    step1Title: 'Chào mừng đến với Vàng Heo Đất!',
    step1Body: 'Tích lũy vàng thật cho con yêu một cách dễ dàng và vui vẻ',
    step2Title: 'Vàng Heo Đất dùng USDC',
    step2Body: 'USDC là đồng tiền kỹ thuật số ổn định, 1 USDC ≈ 1 USD',
    step3Title: 'Bước 1: Mua USDC',
    step3Body: 'Mua USDC trên Binance, Bybit hoặc Remitano rồi chuyển vào ví của bạn trong app',
    step4Title: 'Bước 2: Mua vàng cho heo đất',
    step4Body: 'Dùng USDC để mua GOLD cho heo đất của con — đơn giản chỉ vậy thôi!',
    getStarted: 'Bắt đầu ngay',
    skip: 'Bỏ qua',
    next: 'Tiếp theo',
  },

  piggy: {
    createTitle: 'Tạo Heo Đất cho con',
    namePlaceholder: 'Tên của con (VD: Bé An)',
    targetPlaceholder: 'Mục tiêu (VD: Mua xe đạp)',
    targetAmountPlaceholder: 'Số vàng mục tiêu (gram)',
    createButton: 'Tạo Heo Đất',
    emptyState: 'Bạn chưa có heo đất nào\nHãy tạo heo đất đầu tiên cho con!',
    addPiggy: 'Thêm Heo Đất',
    balance: 'Số dư vàng',
    goldUnit: 'gram',
    targetProgress: 'Tiến độ mục tiêu',
  },

  gift: {
    createTitle: 'Tặng Vàng',
    chooseTemplate: 'Chọn thiệp tặng',
    amountLabel: 'Số vàng tặng (gram)',
    amountPlaceholder: '0.1',
    messagePlaceholder: 'Lời chúc của bạn...',
    createButton: 'Tạo quà tặng',
    shareButton: 'Chia sẻ quà',
    copyLink: 'Sao chép link',
    claimTitle: 'Bạn nhận được quà!',
    claimButton: 'Nhận quà ngay',
    claimedSuccess: 'Đã nhận quà thành công! 🎉',
    expired: 'Quà tặng này đã hết hạn',
    alreadyClaimed: 'Quà tặng này đã được nhận rồi',
    invalidCode: 'Mã quà tặng không hợp lệ',
    expireIn: 'Hết hạn sau',
    days: 'ngày',
  },

  giftTemplate: {
    tet: {
      name: 'Tết Nguyên Đán',
      description: 'Quà mừng năm mới',
      defaultMessage:
        'Chúc mừng năm mới! Gửi tặng bé chút vàng may mắn, mong năm mới tràn đầy niềm vui và bình an 🧧',
    },
    sinhnhat: {
      name: 'Sinh Nhật',
      description: 'Quà mừng sinh nhật',
      defaultMessage:
        'Chúc mừng sinh nhật! Mong bé luôn khỏe mạnh, học giỏi và lớn lên thật hạnh phúc 🎂',
    },
    cuoihoi: {
      name: 'Cưới Hỏi',
      description: 'Quà mừng đám cưới',
      defaultMessage:
        'Chúc mừng hạnh phúc! Gửi tặng bé chút vàng khởi đầu, mong gia đình luôn hạnh phúc và thịnh vượng 💍',
    },
    thoinhoi: {
      name: 'Thôi Nôi',
      description: 'Mừng bé tròn một tuổi',
      defaultMessage:
        'Chúc mừng bé tròn một tuổi! Gửi tặng bé chút vàng khởi đầu, mong bé hay ăn chóng lớn và luôn vui vẻ 🍼',
    },
  },

  wallet: {
    title: 'Ví của tôi',
    usdcBalance: 'Số dư USDC',
    depositUsdc: 'Nạp USDC',
    depositAddress: 'Địa chỉ nạp USDC',
    copyAddress: 'Sao chép địa chỉ',
    addressCopied: 'Đã sao chép!',
    buyGold: 'Mua Vàng',
    usdcAmount: 'Số USDC muốn đổi',
    insufficientBalance: 'Số dư USDC không đủ, vui lòng nạp thêm',
  },

  transaction: {
    title: 'Lịch sử giao dịch',
    buyGold: 'Mua vàng',
    giftSent: 'Tặng vàng',
    giftReceived: 'Nhận vàng',
    empty: 'Chưa có giao dịch nào',
    pending: 'Đang xử lý',
    completed: 'Hoàn thành',
    failed: 'Thất bại',
  },

  common: {
    loading: 'Đang tải...',
    error: 'Có lỗi xảy ra, vui lòng thử lại',
    retry: 'Thử lại',
    cancel: 'Hủy',
    confirm: 'Xác nhận',
    save: 'Lưu',
    done: 'Xong',
    back: 'Quay lại',
    gram: 'gram',
    usdc: 'USDC',
  },
}

export default vi
