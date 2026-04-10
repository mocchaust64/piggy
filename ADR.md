# Architecture Decision Records — Vàng Heo Đất

Ghi lại các quyết định kiến trúc quan trọng và **lý do** đằng sau chúng.
Claude không được đề xuất thay đổi các quyết định này trừ khi có lý do kỹ thuật rõ ràng.

---

## ADR-001: GRAIL API chỉ được gọi từ Supabase Edge Functions

**Ngày:** 09/04/2026
**Trạng thái:** Đã chốt

**Quyết định:** Toàn bộ GRAIL API calls nằm trong `supabase/functions/`. Mobile app chỉ gọi `supabase.functions.invoke()`.

**Lý do:**
- GRAIL API key là credential nhạy cảm — không được có trong app bundle (có thể bị extract)
- Expo/React Native bundle có thể bị decompile → mọi hard-coded secret đều bị lộ
- Edge Functions chạy server-side, GRAIL_API_KEY ở env vars, không bao giờ đến client
- Nếu key bị lộ → toàn bộ custodial wallet của users có thể bị tấn công

**Hệ quả:** File `src/services/grailService.ts` chỉ là thin wrapper gọi invoke, không có HTTP call trực tiếp.

---

## ADR-002: Custodial mode bắt buộc, không có self-custody

**Ngày:** 09/04/2026
**Trạng thái:** Đã chốt

**Quyết định:** Không bao giờ yêu cầu hoặc lưu trữ private key, seed phrase của user. Chỉ dùng GRAIL custodial system.

**Lý do:**
- Target users là cha mẹ 30–45 tuổi, không có kiến thức crypto
- Mất private key = mất vàng vĩnh viễn → không chấp nhận được với savings app cho trẻ em
- Yêu cầu bắt buộc của Oro GRAIL Grant (custodial mode là điều kiện)
- Đơn giản hóa UX — user không cần biết ví hay blockchain

**Hệ quả:** Không tích hợp WalletConnect, Phantom, hay bất kỳ self-custody wallet nào.

---

## ADR-003: Không có fiat on-ramp

**Ngày:** 09/04/2026
**Trạng thái:** Đã chốt

**Quyết định:** Không tích hợp ngân hàng Việt Nam, Momo, ZaloPay, VNPay hay bất kỳ cổng thanh toán fiat nào.

**Lý do:**
- Pháp lý Việt Nam: tích hợp fiat → crypto cần giấy phép VASP, hiện tại chưa có khung pháp lý rõ ràng
- Rủi ro compliance cao, có thể bị đình chỉ hoạt động
- MVP tập trung vào GRAIL Grant — Oro muốn thấy GRAIL API được dùng làm core
- USDC on-ramp qua sàn giao dịch (Binance, OKX) là trách nhiệm của user

**Hệ quả:** Onboarding cần giải thích rõ cho user về cách lấy USDC.

---

## ADR-004: Supabase làm backend duy nhất (không có custom server)

**Ngày:** 09/04/2026
**Trạng thái:** Đã chốt

**Quyết định:** Dùng Supabase (PostgreSQL + Auth + Edge Functions + Storage + Realtime) thay vì tự build API server.

**Lý do:**
- MVP 4 tuần — không đủ thời gian build và maintain custom backend
- Supabase cung cấp Auth (Apple Sign In, OTP) sẵn có
- Edge Functions (Deno) đủ để wrap GRAIL API an toàn
- Realtime subscriptions cho balance update khi nhận gift
- RLS thay thế auth middleware — ít code hơn, ít bug hơn
- Free tier đủ cho MVP và giai đoạn đầu

**Hệ quả:** Mọi business logic phức tạp phải fit vào Edge Functions hoặc PostgreSQL functions. Nếu cần compute nặng hơn trong tương lai → xem xét lại.

---

## ADR-005: Expo Router (file-based) thay vì React Navigation

**Ngày:** 09/04/2026
**Trạng thái:** Đã chốt

**Quyết định:** Dùng Expo Router v3 (file-based routing) thay vì React Navigation.

**Lý do:**
- Deep link handling tự động từ file structure — gift claim link `heodat://gift/[code]` map trực tiếp vào `app/gift/[code].tsx`
- Universal links dễ config hơn
- Type-safe params với `useLocalSearchParams`
- Ít boilerplate hơn React Navigation cho app có nhiều deep links

**Hệ quả:** Routing hoàn toàn dựa vào file structure trong `/app`. Không mix React Navigation.

---

## ADR-006: NativeWind thay vì StyleSheet

**Ngày:** 09/04/2026
**Trạng thái:** Đã chốt

**Quyết định:** Dùng NativeWind v4 (Tailwind cho React Native) cho toàn bộ styling. Không dùng `StyleSheet.create()`.

**Lý do:**
- Consistency với web Tailwind — designer/developer shared vocabulary
- Nhanh hơn khi prototype UI
- Dark mode và responsive dễ implement hơn
- NativeWind v4 dùng CSS variables, performance tốt hơn v2/v3

**Hệ quả:** Mọi component dùng `className` prop. Không có `styles` object.

---

## ADR-007: Gift claim phải là atomic operation

**Ngày:** 09/04/2026
**Trạng thái:** Đã chốt

**Quyết định:** Gift claim được thực hiện trong Edge Function với atomic SQL UPDATE để tránh double-claim.

**Lý do:**
- Gift link có thể được share nhiều người → race condition nếu không có lock
- Double-claim = double debit từ GRAIL custodial wallet → mất tiền thật
- Không thể dùng optimistic lock client-side vì nhiều devices có thể claim cùng lúc
- Atomic pattern: `UPDATE gifts SET status = 'transfer_in_progress' WHERE id = $1 AND status = 'pending' RETURNING *` — nếu 0 rows → đã bị claim rồi

**Hệ quả:** Không bao giờ check-then-update gift status từ mobile client. Phải qua `claim-gift` Edge Function.

---

## ADR-011: MVP dùng 1 GRAIL account per parent + virtual balances per piggy

**Ngày:** 10/04/2026
**Trạng thái:** Tạm thời — chờ confirm từ Oro

**Quyết định:** MVP dùng 1 GRAIL custodial account per parent user. Balance của từng piggy được track trong `piggy_balances.gold_amount` (DB internal). GRAIL chỉ thấy tổng balance của parent.

**Lý do:**
- Chưa confirm được GRAIL có hỗ trợ sub-accounts hay không
- Không muốn block development trong lúc chờ Oro reply
- Schema đã có `piggy_balances.grail_wallet_id` — nếu Oro support sub-accounts thì migrate sau mà không cần đổi UI hay business logic

**Migration path nếu Oro support sub-accounts:**
1. Tạo sub-account trên GRAIL cho mỗi piggy hiện có
2. Populate `piggy_balances.grail_wallet_id`
3. Cập nhật Edge Functions dùng `grail_wallet_id` thay vì `user.grail_user_id`
4. Không cần thay đổi gì ở mobile app

**Hệ quả:** Tất cả GRAIL buy/transfer calls trong Edge Functions dùng `user.grail_user_id` làm wallet identifier. DB là source of truth cho per-piggy balance trong MVP.

---

## ADR-009: pg_cron thay vì external cron service

**Ngày:** 10/04/2026
**Trạng thái:** Đã chốt

**Quyết định:** Dùng `pg_cron` (PostgreSQL extension, Supabase hỗ trợ sẵn) để chạy scheduled jobs thay vì external service (Cron-Job.org, GitHub Actions, Railway).

**Lý do:**
- Supabase Edge Functions không có built-in cron trigger
- `pg_cron` chạy trực tiếp trong database — không cần external service, không thêm infrastructure
- Job đơn giản nhất (expire gifts) chỉ là 1 UPDATE SQL — không cần Edge Function
- Giảm moving parts trong MVP

**Hệ quả:** Nếu cần job phức tạp hơn (gọi GRAIL API theo schedule), sẽ cần external cron gọi Edge Function — xem xét ở Phase 2.

---

## ADR-010: Price data cache trong Supabase thay vì realtime poll

**Ngày:** 10/04/2026
**Trạng thái:** Đã chốt

**Quyết định:** Cache giá GOLD trong bảng `price_cache` (TTL 10 phút), Edge Function `get-gold-price` trả về cache nếu còn hạn. TanStack Query `staleTime: 10 * 60 * 1000`.

**Lý do:**
- Giá vàng không cần realtime cho savings app — 10 phút là đủ
- Tránh gọi GRAIL API quá nhiều (rate limiting, cost)
- Nếu nhiều users mở app cùng lúc → tất cả dùng chung 1 cache, không spam GRAIL

**Hệ quả:** Mini chart dùng data từ `price_cache`. Không WebSocket hay polling từ client.

---

## ADR-008: TanStack Query v5 cho server state, Zustand cho client state

**Ngày:** 09/04/2026
**Trạng thái:** Đã chốt

**Quyết định:** TanStack Query cho mọi Supabase/GRAIL data fetching. Zustand chỉ cho UI state (modal open/close, form state, selected template…).

**Lý do:**
- Phân tách rõ: server state (balance, transactions, gifts) vs UI state
- TanStack Query xử lý caching, invalidation, background refetch — không cần tự implement
- Zustand nhẹ, không cần setup phức tạp
- Không dùng Redux — overkill cho app scale này

**Hệ quả:** Không lưu balance hay transaction data vào Zustand store. Mọi data từ server đều qua TanStack Query.
