import crypto from 'crypto';
const SANDBOX_URL = 'https://www.payfast.co.za/eng/process?testing=true';
//const SANDBOX_URL = 'https://sandbox.payfast.co.za/eng/process';
const LIVE_URL = 'https://www.payfast.co.za/eng/process';

export const isSandbox = () => process.env.PAYFAST_SANDBOX !== 'false';

export const getProcessUrl = () => (isSandbox() ? SANDBOX_URL : LIVE_URL);

/**
 * Build the raw parameter string for signing.
 * IMPORTANT: PayFast expects the values UNENCODED in the signature.
 * URL-encoding only happens at the form-submission stage by the browser.
 */
const buildParamString = (data) => {
    return Object.keys(data)
        .filter((key) => {
            const val = data[key];
            return val !== undefined && val !== null && String(val) !== '';
        })
        .map((key) => `${key}=${String(data[key]).trim()}`)
        .join('&');
};

/**
 * Fields that participate in the PayFast signature, in the exact order
 * PayFast specifies.
 */
const CHECKOUT_ORDER = [
    'merchant_id',
    'merchant_key',
    'return_url',
    'cancel_url',
    'notify_url',
    'name_first',
    'name_last',
    'email_address',
    'm_payment_id',
    'amount',
    'item_name',
    'item_description',
    'custom_int1',
    'custom_int2',
    'custom_int3',
    'custom_int4',
    'custom_int5',
    'custom_str1',
    'custom_str2',
    'custom_str3',
    'custom_str4',
    'custom_str5',
    'email_confirmation',
    'confirmation_address',
    'payment_method',
];

const ITN_ORDER = [
    'm_payment_id',
    'pf_payment_id',
    'payment_status',
    'item_name',
    'item_description',
    'amount_gross',
    'amount_fee',
    'amount_net',
    'custom_str1',
    'custom_str2',
    'custom_str3',
    'custom_str4',
    'custom_str5',
    'custom_int1',
    'custom_int2',
    'custom_int3',
    'custom_int4',
    'custom_int5',
    'name_first',
    'name_last',
    'email_address',
    'merchant_id',
];

const pickOrdered = (data, order) => {
    const out = {};
    for (const key of order) {
        if (data[key] !== undefined && data[key] !== null && String(data[key]) !== '') {
            out[key] = data[key];
        }
    }
    return out;
};

/**
 * Generate the MD5 signature for a checkout payload.
 * If a passphrase is configured, it is appended.
 */
export const generateSignature = (fields) => {
    const ordered = pickOrdered(fields, CHECKOUT_ORDER);
    let str = buildParamString(ordered);

    const passphrase = (process.env.PAYFAST_PASSPHRASE || '').trim();
    if (passphrase) {
        str += `&passphrase=${passphrase}`;
    }

    return crypto.createHash('md5').update(str).digest('hex');
};

/**
 * Build the payload to hand to the browser for form submission.
 * The browser will URL-encode values; we don't pre-encode them here.
 */
export const buildCheckoutPayload = ({
                                         orderId,
                                         amount,
                                         itemName,
                                         itemDescription,
                                         firstName,
                                         lastName,
                                         email,
                                     }) => {
    const fields = {
        merchant_id: process.env.PAYFAST_MERCHANT_ID,
        merchant_key: process.env.PAYFAST_MERCHANT_KEY,
        return_url: process.env.PAYFAST_RETURN_URL,
        cancel_url: process.env.PAYFAST_CANCEL_URL,
        notify_url: process.env.PAYFAST_NOTIFY_URL,
        name_first: firstName || 'Student',
        name_last: lastName || 'User',
        email_address: email,
        m_payment_id: String(orderId),
        amount: Number(amount).toFixed(2),
        item_name: itemName.slice(0, 100),
        item_description: (itemDescription || '').slice(0, 255),
        custom_str1: String(orderId),
        email_confirmation: '1',
        confirmation_address: email,
    };

    // DEBUG
    const debugOrdered = pickOrdered(fields, CHECKOUT_ORDER);
    let debugStr = buildParamString(debugOrdered);
    const debugPass = (process.env.PAYFAST_PASSPHRASE || '').trim();
    if (debugPass) debugStr += `&passphrase=${debugPass}`;

    console.log('===== PAYFAST CHECKOUT DEBUG =====');
    console.log('Signing string (before MD5):');
    console.log(debugStr);
    console.log('');
    console.log('Merchant ID:', JSON.stringify(process.env.PAYFAST_MERCHANT_ID));
    console.log('Merchant Key:', JSON.stringify(process.env.PAYFAST_MERCHANT_KEY));
    console.log('Passphrase:', JSON.stringify(process.env.PAYFAST_PASSPHRASE));
    console.log('Sandbox?', process.env.PAYFAST_SANDBOX);

    fields.signature = generateSignature(fields);

    console.log('Generated signature:', fields.signature);
    console.log('===== END PAYFAST DEBUG =====');

    return { action: getProcessUrl(), fields };
};

/**
 * Verify the signature on an incoming ITN.
 */
export const verifyItnSignature = (itnData) => {
    const { signature, ...rest } = itnData;
    const ordered = pickOrdered(rest, ITN_ORDER);
    let str = buildParamString(ordered);

    const passphrase = (process.env.PAYFAST_PASSPHRASE || '').trim();
    if (passphrase) {
        str += `&passphrase=${passphrase}`;
    }

    const expected = crypto.createHash('md5').update(str).digest('hex');
    return expected === signature;
};

/**
 * Verify ITN came from a legitimate PayFast host.
 */
export const isTrustedPayfastHost = (hostname) => {
    if (!hostname) return false;
    const host = hostname.toLowerCase();
    const allowed = [
        'payfast.co.za',
        'www.payfast.co.za',
        'sandbox.payfast.co.za',
        'w1w.payfast.co.za',
        'w2w.payfast.co.za',
    ];
    return allowed.includes(host);
};