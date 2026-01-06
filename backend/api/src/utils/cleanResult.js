const normalizeVendorName = (name) => name.trim().toUpperCase();
const normalizeVendorId = (id) => id.trim().toUpperCase();
const normalizeLocation = (loc) =>
  loc
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
const normalizeBudgetHead = (bh) => String(bh).trim();
const normalizePurpose = (p) => p.trim();

const cleanResult = (rows) => {
  const valid_Payment_modes = ["NEFT", "RTGS", "CHEQUE"];
  let data = rows.filter(
    (row) =>
      row.transaction_id &&
      row.transaction_date &&
      row.department &&
      row.vendor_id &&
      row.amount &&
      row.payment_mode &&
      valid_Payment_modes.includes(row.payment_mode.trim().toUpperCase()) &&
      row.purpose &&
      row.amount &&
      (Number.isFinite(Number(row.amount)) || Number(row.amount) > 0) &&
      !isNaN(new Date(row.transaction_date).getTime())
  );

  data = data.map((row) => {
    const dateObj = new Date(row.transaction_date);

    return {
      ...row,
      department: row.department.trim(),
      vendor_name: normalizeVendorName(row.vendor_name) || "",
      vendor_id: normalizeVendorId(row.vendor_id),
      payment_mode: row.payment_mode.trim().toUpperCase(),
      budget_head: normalizeBudgetHead(row.budget_head),
      month: dateObj.getMonth() + 1,
      purpose: normalizePurpose(row.purpose),
      year: dateObj.getFullYear(),
      day: dateObj.getDate(),
      isMonthEnd: dateObj.getDate() >= 28,
      location: normalizeLocation(row.location),
    };
  });

  return data;
};

export { cleanResult };
