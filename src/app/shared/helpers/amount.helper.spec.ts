import { roundedToThousand, summarizeRounding } from './amount.helper';

describe('amount.helper', () => {
  describe('roundedToThousand', () => {
    it('làm tròn lên đến nghìn', () => {
      expect(roundedToThousand(261666.67)).toBe(262000);
      expect(roundedToThousand(240238.1)).toBe(241000);
    });

    it('giữ nguyên số đã tròn nghìn', () => {
      expect(roundedToThousand(225000)).toBe(225000);
      expect(roundedToThousand(0)).toBe(0);
    });

    it('nhiễu số thực không đẩy số tròn nghìn lên thêm 1.000', () => {
      expect(roundedToThousand(100000.00000000001)).toBe(100000);
      expect(roundedToThousand(33333.333333333336 + 66666.66666666667)).toBe(100000);
    });
  });

  describe('summarizeRounding', () => {
    it('3 người chia 785.000: tổng thu 786.000, dư 1.000', () => {
      const share = 785000 / 3;

      expect(summarizeRounding([share, share, share], 785000)).toEqual({
        collected: 786000,
        billTotal: 785000,
        surplus: 1000,
      });
    });

    it('chia khéo ra đúng nghìn thì không có chênh lệch', () => {
      expect(summarizeRounding([225000, 225000], 450000)).toBeNull();
    });

    it('tổng thu thấp hơn hóa đơn (có khoản mục chưa ai tham gia) không coi là làm tròn', () => {
      expect(summarizeRounding([100000, 100000], 450000)).toBeNull();
    });

    it('suất lẻ: phần dư cộng dồn từ từng người', () => {
      // 785.000 chia theo 1,5 / 1 / 1 suất.
      const total = 785000;
      const amounts = [(total * 1.5) / 3.5, total / 3.5, total / 3.5];

      expect(summarizeRounding(amounts, total)).toEqual({
        collected: 787000,
        billTotal: 785000,
        surplus: 2000,
      });
    });
  });
});
