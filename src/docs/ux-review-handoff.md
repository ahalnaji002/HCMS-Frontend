# مراجعة الجودة والواجهة — ملاحظات تسليم لسبرنت 10

**التاريخ:** 10 نوفمبر 2026
**الهدف:** تلخيص كل التعديلات اللي صارت بعد سبرنت 9، وشو لازم تعرفه قبل ما تبلّش سبرنت 10.

> **أهم نقطة:** ابدأ سبرنت 10 من آخر نسخة من `develop`. كل شاشة جديدة صارت **صفحة لها رابط**، مش قسم بصفحة طويلة.

---

## 1. ملخص عام لكل الشغل

### الباك (كله مدموج على `develop`)
| PR | التعديل |
|---|---|
| #103 | Rate limiting (طوارئ عامة، دخول، تسجيل) + helmet + CORS مقيّد + توحيد معالجة الأخطاء + تقسيم التستات لـ 21 ملف + Coverage (93%) |
| #104 | CI على GitHub Actions (455+ تست، coverage، audit) |
| #105 | `npm run seed:demo` — بيانات عرض كاملة (18 حساب، كلمة السر `Demo@2026`) |
| #106 | قائمة تعيينات الأدمن صارت ترجع `patient_name` و`doctor_name` و`specialization` |

### الفرونت
| PR | الحالة | التعديل |
|---|---|---|
| #65 | مدموج | رسالة واضحة عند 429 (كثرة المحاولات) بالدخول والتسجيل |
| #66 | مدموج | CI: lint + build + Playwright على كل PR |
| #67 + #68 | مدموج | زر طوارئ عائم + تحديد الموقع GPS؛ **صفحات حقيقية لكل قسم**؛ رسائل الأدمن كـ toast |
| #69 | مدموج | لوحة "يحتاج انتباهك" بنظرة كل دور |
| #70 | مدموج | إخفاء روابط "قريباً" من الـ Sidebar |
| #71 | مدموج | العربي هو اللغة الافتراضية للزائر الجديد |
| #72 | مدموج | ترجمة رسائل السيرفر + تنظيف نظرة المريض |
| (هذا الـ PR) | للدمج | رابط اتصال وخريطة بطوارئ الأدمن + هذا الملف |

**حسابات الـ Demo:** كلها بكلمة السر `Demo@2026`، والأدمن `admin@hcms.local` (على بيئة التطوير). الجدول الكامل بـ README الباك → قسم *Demo Data*.

---

## 2. اللي بيخصك بسبرنت 10

### 2.1 كيف تضيف شاشة جديدة (الهيكل الجديد)
كل دور إله "Feature" فيه `Routes` خاصة فيه، والبيانات بتنحمّل مرة وحدة وبتتشارك بين صفحاته:

- المريض: `src/presentation/features/patient-workspace/PatientWorkspaceFeature.jsx`
- الطبيب: `src/presentation/features/doctor-workspace/DoctorWorkspaceFeature.jsx`
- الأدمن: `src/presentation/features/admin-workspace/AdminWorkspaceFeature.jsx`
- `src/app/App.jsx` بيمرّر `/<role>/*`، فالمسارات الفرعية بتتعرف داخل الـ Feature.

**خطوات إضافة صفحة (مثال: طلبات المساعدة للأدمن):**
1. أضف `<Route path="assistance-requests" element={...} />` داخل `Routes` بالـ Feature.
2. بـ `src/presentation/layouts/roleNavigation.js` غيّر العنصر الموجود إلى:
   `{ label: "roleNavigation.admin.assistanceRequests", href: "/admin/assistance-requests", available: true }`
   → الرابط بيظهر تلقائيًا (العناصر بدون `available` مخفية).
3. اكتب تست Playwright بيفتح الرابط مباشرة: `page.goto("/admin/assistance-requests")`.

**الـ NGO** لسا بيستخدم `RoleHome` (صفحة وحدة). أول شاشة NGO: اعمل `NgoWorkspaceFeature` بنفس نمط الأدمن (`Routes` + `index` للنظرة العامة)، وغيّر `App.jsx` يستخدمه لدور `NGO`.

### 2.2 مكوّنات جاهزة استخدمها
| المكوّن | المكان | الاستخدام |
|---|---|---|
| `StatusToast` | `components/common/StatusToast.jsx` | رسائل نجاح/خطأ ثابتة بالشاشة، بتنمسح بالتنقل |
| `translateServerMessage` | `utils/serverMessages.js` | ترجمة رسائل الباك. **أي رسالة جديدة من الباك أضفها للجدول** + مفتاحها بـ `ar.json`/`en.json` تحت `serverMessages` |
| `AttentionPanel` | `features/role-dashboard/AttentionPanel.jsx` | لوحة "يحتاج انتباهك" — مرّر `attention={(dashboard) => [...]}` لـ `RoleDashboard` (مثال جاهز بالأدمن) |
| `geolocation` | `utils/geolocation.js` | `parseCoordinates` و`mapUrl` لعرض أي موقع على الخريطة |

**قاعدة للرسائل:** خزّن مفتاح الترجمة مش النص (`{ key: "..." }`)، وترجم وقت العرض، عشان الرسالة تتبع تغيير اللغة.

### 2.3 Issues من سبرنت 10 تم لمسها (بشكل جزئي)
| Issue | شو صار | شو ضايلك |
|---|---|---|
| **#21** Administrator Emergency Management | صفحة الطوارئ صارت مستقلة (`/admin/emergency-alerts`) وأول رابط بالقائمة؛ بطاقة "طوارئ بانتظار طبيب" بالنظرة؛ رابط اتصال + خريطة لكل تنبيه | منطق إدارة الطوارئ نفسه ما انلمس — كمّل عليه |
| **#32** Responsive & Consistency Polish | العربي افتراضي؛ ترجمة رسائل السيرفر؛ مسافات العناوين؛ إخفاء "قريباً"؛ تنظيف نظرة المريض | باقي التلميع |
| **#40** (9.5) | شغله مدموج من سبرنت 9 | **سكّره** |

### 2.4 ميزات ناقصة **ما إلها issue** (لازم نقرر مين ياخدها)
| الميزة | المتطلب | الـ Endpoint الجاهز بالباك |
|---|---|---|
| الطبيب يبدأ/ينهي حالة طوارئ | FR-6.4 | `PATCH /api/doctor/emergency-alerts/:alertId/status` |
| تنبيه طوارئ عام بصفحة الهبوط (بدون حساب) | FR-6.1 | `POST /api/emergency-alerts` |
| المريض يلغي تنبيه | FR-6.5 | `PATCH /api/patient/emergency-alerts/:alertId/cancel` |
| المريض يتابع طلبات المساعدة | FR-7.4 | `GET /api/patient/assistance-requests` |
| الطبيب يطلب مساعدة لمريض | FR-7.1 | `POST /api/doctor/patients/:patientId/assistance-requests` |
| إدارة المستخدمين والمؤسسات | FR-10.1/10.2 | ❌ لسا ما انبنى بالباك (قرار: بنضيفه) |

**ملاحظة باك معروفة:** عدّاد `active_emergency_alerts` بالـ Dashboard بيحسب التنبيهات الملغاة (`CANCELLED`) كنشطة — بيتصلّح بالباك.

### 2.5 التستات والـ CI
- **كل PR على `develop` بيمرّ على CI** (lint + build + 160+ تست Playwright). لا تدمج قبل ✅.
- التستات مكتوبة على **الواجهة الإنجليزية**: Playwright بيبلّش بالإنجليزي عبر `tests/fixtures/english-browser-state.json` (التطبيق نفسه عربي افتراضيًا).
- الـ mocks بالتستات لازم تطابق رد الباك الحقيقي (مشكلة أسماء التعيينات طلعت لأنه الـ mock كان فيه حقول الباك ما بيرجّعها). شغّل `npm run test:integration` على باك حقيقي قبل التسليم.
- تست بيعتمد على التوقيت (`setTimeout`) ممكن ينجح عندك ويفشل على CI — استخدم انتظار حالة بدل وقت ثابت.
