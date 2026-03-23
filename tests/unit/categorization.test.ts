import { describe, it, expect } from 'vitest';
import { getCategoryFromDescription } from '@/lib/categories';
import { categorizationTestCases } from '../fixtures/sample-transactions';

describe('Categorization', () => {
  describe('Groceries', () => {
    const groceryKeywords = ['coles', 'woolworths', 'iga', 'supermarket'];

    groceryKeywords.forEach(keyword => {
      it(`should categorize "${keyword}" as groceries`, () => {
        const description = `${keyword.toUpperCase()} SUPERMARKET`;
        expect(getCategoryFromDescription(description)).toBe('groceries');
      });
    });

    it('should handle lowercase grocery keywords', () => {
      expect(getCategoryFromDescription('shop at coles')).toBe('groceries');
      expect(getCategoryFromDescription('woolies grocery')).toBe('groceries');
    });
  });

  describe('Transport', () => {
    const transportKeywords = ['ptv', 'uber', 'didi', 'ola', 'taxi', 'public transport'];

    transportKeywords.forEach(keyword => {
      it(`should categorize "${keyword}" as transport`, () => {
        const description = `${keyword.toUpperCase()} TOP UP`;
        expect(getCategoryFromDescription(description)).toBe('transport');
      });
    });

    it('should handle ride share services', () => {
      expect(getCategoryFromDescription('UBER TRIP MELBOURNE')).toBe('transport');
      expect(getCategoryFromDescription('DIDI RIDE SYDNEY')).toBe('transport');
    });
  });

  describe('Utilities', () => {
    const utilityKeywords = ['energy', 'water', 'gas', 'internet', 'telstra', 'optus', 'vodafone', 'electricity'];

    utilityKeywords.forEach(keyword => {
      it(`should categorize "${keyword}" as utilities`, () => {
        const description = `${keyword.toUpperCase()} BILL`;
        expect(getCategoryFromDescription(description)).toBe('utilities');
      });
    });

    it('should handle mobile and internet providers', () => {
      expect(getCategoryFromDescription('TELSTRA MOBILE')).toBe('utilities');
      expect(getCategoryFromDescription('OPTUS INTERNET PLAN')).toBe('utilities');
    });
  });

  describe('Rent', () => {
    it('should categorize rent-related transactions', () => {
      expect(getCategoryFromDescription('RENT PAYMENT')).toBe('rent');
      expect(getCategoryFromDescription('REAL ESTATE RENT')).toBe('rent');
    });
  });

  describe('Education', () => {
    const educationKeywords = ['university', 'tafe', 'school', 'education'];

    educationKeywords.forEach(keyword => {
      it(`should categorize "${keyword}" as education`, () => {
        const description = `${keyword.toUpperCase()} FEE`;
        expect(getCategoryFromDescription(description)).toBe('education');
      });
    });

    it('should handle specific institution names', () => {
      expect(getCategoryFromDescription('UNIVERSITY OF MELBOURNE')).toBe('education');
      expect(getCategoryFromDescription('TAFE NSW')).toBe('education');
    });
  });

  describe('Shopping', () => {
    const shoppingKeywords = ['kmart', 'target', 'big w', 'shopping', 'myer', 'david jones'];

    shoppingKeywords.forEach(keyword => {
      it(`should categorize "${keyword}" as shopping`, () => {
        const description = `${keyword.toUpperCase()} STORE`;
        expect(getCategoryFromDescription(description)).toBe('shopping');
      });
    });

    it('should handle department stores', () => {
      expect(getCategoryFromDescription('MYER DEPARTMENT STORE')).toBe('shopping');
      expect(getCategoryFromDescription('DAVID JONES MELBOURNE')).toBe('shopping');
    });
  });

  describe('Food', () => {
    const foodKeywords = ['restaurant', 'cafe', 'mcdonalds', 'hungry jacks', 'kfc', 'snack bar', 'food'];

    foodKeywords.forEach(keyword => {
      it(`should categorize "${keyword}" as food`, () => {
        const description = `${keyword.toUpperCase()} ORDER`;
        expect(getCategoryFromDescription(description)).toBe('food');
      });
    });

    it('should handle fast food chains', () => {
      expect(getCategoryFromDescription('MCDONALDS CAMBERWELL')).toBe('food');
      expect(getCategoryFromDescription('KFC COLLINS STREET')).toBe('food');
      expect(getCategoryFromDescription('HUNGRY JACKS RICHMOND')).toBe('food');
    });

    it('should handle cafe and coffee shops', () => {
      expect(getCategoryFromDescription('CAFE LATTITUDE')).toBe('food');
      expect(getCategoryFromDescription('COFFEE SHOP MELBOURNE')).toBe('food');
    });
  });

  describe('Entertainment', () => {
    const entertainmentKeywords = ['entertainment', 'cinema', 'eventbrite', 'ticketmaster', 'netflix', 'spotify'];

    entertainmentKeywords.forEach(keyword => {
      it(`should categorize "${keyword}" as entertainment`, () => {
        const description = `${keyword.toUpperCase()} SUBSCRIPTION`;
        expect(getCategoryFromDescription(description)).toBe('entertainment');
      });
    });

    it('should handle streaming services', () => {
      expect(getCategoryFromDescription('NETFLIX SUBSCRIPTION')).toBe('entertainment');
      expect(getCategoryFromDescription('SPOTIFY PREMIUM')).toBe('entertainment');
    });

    it('should handle ticket vendors', () => {
      expect(getCategoryFromDescription('EVENTBRITE TICKET')).toBe('entertainment');
      expect(getCategoryFromDescription('TICKETMASTER AUSTRALIA')).toBe('entertainment');
    });
  });

  describe('Healthcare', () => {
    const healthcareKeywords = ['health', 'pharmacy', 'chemist', 'doctor', 'hospital'];

    healthcareKeywords.forEach(keyword => {
      it(`should categorize "${keyword}" as healthcare`, () => {
        const description = `${keyword.toUpperCase()} CLINIC`;
        expect(getCategoryFromDescription(description)).toBe('healthcare');
      });
    });

    it('should handle pharmacies', () => {
      expect(getCategoryFromDescription('CHEMIST WAREHOUSE')).toBe('healthcare');
      expect(getCategoryFromDescription('PUNCHBOWL PHARMACY')).toBe('healthcare');
    });
  });

  describe('Friends/Transfers', () => {
    const friendKeywords = ['friends', 'mobile banking payment', 'transfer to', 'transfer from', 'pay anyone', 'osko', 'pay id'];

    friendKeywords.forEach(keyword => {
      it(`should categorize "${keyword}" as friends`, () => {
        const description = `${keyword.toUpperCase()} TRANSACTION`;
        expect(getCategoryFromDescription(description)).toBe('friends');
      });
    });

    it('should handle bank transfers', () => {
      expect(getCategoryFromDescription('Transfer to John Smith')).toBe('friends');
      expect(getCategoryFromDescription('Mobile Banking Payment')).toBe('friends');
    });
  });

  describe('Miscellaneous', () => {
    it('should categorize unknown descriptions as misc', () => {
      const unknownDescriptions = [
        'Random Description XYZ',
        'ABCDEFGHIJKLMNOP',
        'Some random text without keywords',
        '',
      ];

      unknownDescriptions.forEach(desc => {
        expect(getCategoryFromDescription(desc)).toBe('misc');
      });
    });
  });

  describe('Comprehensive Test Cases', () => {
    categorizationTestCases.forEach(({ description, expectedCategory }) => {
      it(`should categorize "${description}" as ${expectedCategory}`, () => {
        expect(getCategoryFromDescription(description)).toBe(expectedCategory);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty description', () => {
      expect(getCategoryFromDescription('')).toBe('misc');
    });

    it('should handle description with special characters', () => {
      expect(getCategoryFromDescription('COLES #123!@$')).toBe('groceries');
    });

    it('should handle description with numbers', () => {
      expect(getCategoryFromDescription('COLES SUPERMARKET 1234')).toBe('groceries');
    });

    it('should handle mixed case keywords', () => {
      expect(getCategoryFromDescription('CoLeS SuPeRmArKeT')).toBe('groceries');
      expect(getCategoryFromDescription('McDoNaLdS')).toBe('food');
    });

    it('should prioritize first matching category', () => {
      const description = 'UBER EATS';
      expect(getCategoryFromDescription(description)).toBe('transport');
    });
  });
});
