import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  mapAnalysisDetailToViewModel,
  formatAnalysisDate,
  formatRelativeDate,
  formatPetSummary,
  isValidUrl,
  classifyApiError,
  isValidUuid,
  mapToReanalyzePayload,
  getRecommendationBadgeClass,
  getRecommendationLabel,
} from '../../utils/resultsMappers'
import type { AnalysisDetailDto, AnalysisResultViewModel } from '../../types/results'

describe('resultsMappers', () => {
  describe('mapAnalysisDetailToViewModel', () => {
    const baseDto: AnalysisDetailDto = {
      analysisId: '123e4567-e89b-12d3-a456-426614174000',
      productId: '456e7890-e89b-12d3-a456-426614174000',
      productName: 'Premium Dog Food',
      productUrl: 'https://example.com/product',
      recommendation: 'Recommended',
      justification: 'Great ingredients',
      concerns: [],
      species: 'Dog',
      breed: 'Golden Retriever',
      age: 5,
      additionalInfo: 'Very active dog',
      ingredientsText: 'Chicken, rice, vegetables',
      createdAt: '2024-01-01T12:00:00Z',
    }

    it('should map all DTO fields to ViewModel correctly', () => {
      const result = mapAnalysisDetailToViewModel(baseDto)

      expect(result).toEqual({
        analysisId: '123e4567-e89b-12d3-a456-426614174000',
        productId: '456e7890-e89b-12d3-a456-426614174000',
        productName: 'Premium Dog Food',
        productUrl: 'https://example.com/product',
        recommendation: 'Recommended',
        justification: 'Great ingredients',
        concerns: [],
        species: 'Dog',
        breed: 'Golden Retriever',
        age: 5,
        additionalInfo: 'Very active dog',
        ingredientsText: 'Chicken, rice, vegetables',
        createdAt: '2024-01-01T12:00:00Z',
      })
    })

    it('should handle null productUrl', () => {
      const dto = { ...baseDto, productUrl: null as any }
      const result = mapAnalysisDetailToViewModel(dto)

      expect(result.productUrl).toBeNull()
    })

    it('should map concerns array correctly', () => {
      const dto = {
        ...baseDto,
        concerns: [
          {
            type: 'questionable' as const,
            ingredient: 'Corn',
            reason: 'May cause allergies',
          },
          {
            type: 'unacceptable' as const,
            ingredient: 'BHA',
            reason: 'Artificial preservative',
          },
        ],
      }
      const result = mapAnalysisDetailToViewModel(dto)

      expect(result.concerns).toHaveLength(2)
      expect(result.concerns[0]).toEqual({
        type: 'questionable',
        ingredient: 'Corn',
        reason: 'May cause allergies',
      })
      expect(result.concerns[1]).toEqual({
        type: 'unacceptable',
        ingredient: 'BHA',
        reason: 'Artificial preservative',
      })
    })

    it('should handle empty concerns array', () => {
      const dto = { ...baseDto, concerns: [] }
      const result = mapAnalysisDetailToViewModel(dto)

      expect(result.concerns).toEqual([])
    })

    it('should handle missing concerns field by providing empty array', () => {
      const dto = { ...baseDto, concerns: undefined as any }
      const result = mapAnalysisDetailToViewModel(dto)

      expect(result.concerns).toEqual([])
    })

    it('should preserve all pet info (species, breed, age)', () => {
      const result = mapAnalysisDetailToViewModel(baseDto)

      expect(result.species).toBe('Dog')
      expect(result.breed).toBe('Golden Retriever')
      expect(result.age).toBe(5)
    })

    it('should handle null additionalInfo', () => {
      const dto = { ...baseDto, additionalInfo: null }
      const result = mapAnalysisDetailToViewModel(dto)

      expect(result.additionalInfo).toBeNull()
    })

    it('should handle null ingredientsText', () => {
      const dto = { ...baseDto, ingredientsText: null }
      const result = mapAnalysisDetailToViewModel(dto)

      expect(result.ingredientsText).toBeNull()
    })

    it('should handle Cat species', () => {
      const dto = { ...baseDto, species: 'Cat' as const }
      const result = mapAnalysisDetailToViewModel(dto)

      expect(result.species).toBe('Cat')
    })

    it('should handle NotRecommended recommendation', () => {
      const dto = { ...baseDto, recommendation: 'NotRecommended' as const }
      const result = mapAnalysisDetailToViewModel(dto)

      expect(result.recommendation).toBe('NotRecommended')
    })
  })

  describe('formatAnalysisDate', () => {
    it('should format valid ISO date to localized string', () => {
      const result = formatAnalysisDate('2024-01-15T14:30:00Z')

      // Check that it includes expected components
      expect(result).toContain('January')
      expect(result).toContain('15')
      expect(result).toContain('2024')
      expect(result).toMatch(/\d+:\d{2}/) // Time with colon
      expect(result).toMatch(/AM|PM/) // 12-hour format
    })

    it('should use en-US locale format', () => {
      const result = formatAnalysisDate('2024-12-25T12:00:00Z')

      expect(result).toContain('December')
      expect(result).toContain('2024')
    })

    it('should include year, month, day, hour, minute', () => {
      const result = formatAnalysisDate('2024-03-10T08:15:00Z')

      expect(result).toContain('March')
      expect(result).toContain('10')
      expect(result).toContain('2024')
      expect(result).toMatch(/\d{1,2}:\d{2}/)
    })

    it('should use 12-hour format with AM/PM', () => {
      const morningResult = formatAnalysisDate('2024-01-01T08:00:00Z')
      const eveningResult = formatAnalysisDate('2024-01-01T20:00:00Z')

      // At least one should have AM or PM
      expect(morningResult + eveningResult).toMatch(/AM|PM/)
    })

    it('should handle invalid date gracefully (return original)', () => {
      const invalidDate = 'not-a-date'
      const result = formatAnalysisDate(invalidDate)

      expect(result).toBe(invalidDate)
    })

    it('should handle empty string', () => {
      const result = formatAnalysisDate('')

      expect(result).toBe('')
    })

    it('should handle malformed ISO string', () => {
      const malformed = '2024-13-45T99:99:99Z'
      const result = formatAnalysisDate(malformed)

      expect(result).toBe(malformed)
    })
  })

  describe('formatRelativeDate', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should return "just now" for < 60 seconds', () => {
      const date = new Date('2024-01-15T11:59:30Z').toISOString()
      const result = formatRelativeDate(date)

      expect(result).toBe('just now')
    })

    it('should return "X minutes ago" for < 60 minutes', () => {
      const date = new Date('2024-01-15T11:30:00Z').toISOString()
      const result = formatRelativeDate(date)

      expect(result).toBe('30 minutes ago')
    })

    it('should handle singular "1 minute ago"', () => {
      const date = new Date('2024-01-15T11:59:00Z').toISOString()
      const result = formatRelativeDate(date)

      expect(result).toBe('1 minute ago')
    })

    it('should return "X hours ago" for < 24 hours', () => {
      const date = new Date('2024-01-15T09:00:00Z').toISOString()
      const result = formatRelativeDate(date)

      expect(result).toBe('3 hours ago')
    })

    it('should handle singular "1 hour ago"', () => {
      const date = new Date('2024-01-15T11:00:00Z').toISOString()
      const result = formatRelativeDate(date)

      expect(result).toBe('1 hour ago')
    })

    it('should return "X days ago" for < 30 days', () => {
      const date = new Date('2024-01-10T12:00:00Z').toISOString()
      const result = formatRelativeDate(date)

      expect(result).toBe('5 days ago')
    })

    it('should handle singular "1 day ago"', () => {
      const date = new Date('2024-01-14T12:00:00Z').toISOString()
      const result = formatRelativeDate(date)

      expect(result).toBe('1 day ago')
    })

    it('should fall back to formatAnalysisDate for >= 30 days', () => {
      const date = new Date('2023-12-01T12:00:00Z').toISOString()
      const result = formatRelativeDate(date)

      // Should be formatted date, not relative
      expect(result).not.toMatch(/ago$/)
      expect(result).toContain('December')
    })

    it('should handle invalid date gracefully', () => {
      const invalid = 'not-a-date'
      const result = formatRelativeDate(invalid)

      expect(result).toBe(invalid)
    })

    it('should handle future dates correctly', () => {
      const future = new Date('2024-01-20T12:00:00Z').toISOString()
      const result = formatRelativeDate(future)

      // Negative diff - should either be "just now" or formatted
      expect(result).toBeTruthy()
    })
  })

  describe('formatPetSummary', () => {
    it('should format with age, breed, and species', () => {
      const result = formatPetSummary('Dog', 'Golden Retriever', 5)

      expect(result).toBe('5 years old Golden Retriever Dog')
    })

    it('should handle singular "1 year old"', () => {
      const result = formatPetSummary('Cat', 'Persian', 1)

      expect(result).toBe('1 year old Persian Cat')
    })

    it('should handle plural "X years old"', () => {
      const result = formatPetSummary('Dog', 'Labrador', 10)

      expect(result).toBe('10 years old Labrador Dog')
    })

    it('should handle null breed (omit from output)', () => {
      const result = formatPetSummary('Dog', null, 3)

      expect(result).toBe('3 years old Dog')
      expect(result).not.toContain('null')
    })

    it('should handle null age (omit from output)', () => {
      const result = formatPetSummary('Cat', 'Siamese', null)

      expect(result).toBe('Siamese Cat')
      expect(result).not.toContain('null')
      expect(result).not.toContain('years old')
    })

    it('should always include species', () => {
      const result = formatPetSummary('Dog', null, null)

      expect(result).toBe('Dog')
    })

    it('should format: "2 years old Golden Retriever Dog"', () => {
      const result = formatPetSummary('Dog', 'Golden Retriever', 2)

      expect(result).toBe('2 years old Golden Retriever Dog')
    })

    it('should format: "Dog" when only species provided', () => {
      const result = formatPetSummary('Dog', null, null)

      expect(result).toBe('Dog')
    })

    it('should handle empty string breed as truthy', () => {
      const result = formatPetSummary('Cat', '', 5)

      // Empty string is falsy in this context, should not appear
      expect(result).toBe('5 years old Cat')
    })

    it('should order parts correctly: age, breed, species', () => {
      const result = formatPetSummary('Dog', 'Beagle', 7)
      const parts = result.split(' ')

      expect(parts[0]).toBe('7')
      expect(result).toMatch(/Beagle Dog$/)
    })
  })

  describe('isValidUrl', () => {
    it('should return true for valid HTTP URL', () => {
      expect(isValidUrl('http://example.com')).toBe(true)
    })

    it('should return true for valid HTTPS URL', () => {
      expect(isValidUrl('https://example.com')).toBe(true)
    })

    it('should return false for null', () => {
      expect(isValidUrl(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isValidUrl(undefined)).toBe(false)
    })

    it('should return false for empty string', () => {
      expect(isValidUrl('')).toBe(false)
    })

    it('should return false for malformed URL', () => {
      expect(isValidUrl('not a url')).toBe(false)
    })

    it('should return false for relative path', () => {
      expect(isValidUrl('/path/to/page')).toBe(false)
    })

    it('should handle URLs with ports', () => {
      expect(isValidUrl('https://example.com:8080')).toBe(true)
    })

    it('should handle URLs with query params', () => {
      expect(isValidUrl('https://example.com/page?param=value')).toBe(true)
    })

    it('should handle URLs with fragments', () => {
      expect(isValidUrl('https://example.com/page#section')).toBe(true)
    })

    it('should handle URLs with paths', () => {
      expect(isValidUrl('https://example.com/path/to/resource')).toBe(true)
    })

    it('should return false for protocol-only', () => {
      expect(isValidUrl('https://')).toBe(false)
    })
  })

  describe('classifyApiError', () => {
    it('should classify 401 as unauthorized', () => {
      const result = classifyApiError(401)

      expect(result.type).toBe('unauthorized')
      expect(result.message).toBe('You must be logged in to view this analysis.')
    })

    it('should classify 404 as notFound', () => {
      const result = classifyApiError(404)

      expect(result.type).toBe('notFound')
      expect(result.message).toContain('not found')
    })

    it('should classify 500 as server error', () => {
      const result = classifyApiError(500)

      expect(result.type).toBe('server')
      expect(result.message).toContain('server error')
    })

    it('should classify 502 as server error', () => {
      const result = classifyApiError(502)

      expect(result.type).toBe('server')
    })

    it('should classify 503 as server error', () => {
      const result = classifyApiError(503)

      expect(result.type).toBe('server')
    })

    it('should classify 504 as server error', () => {
      const result = classifyApiError(504)

      expect(result.type).toBe('server')
    })

    it('should classify unknown codes as network error', () => {
      const result = classifyApiError(0)

      expect(result.type).toBe('network')
      expect(result.message).toBeTruthy()
      expect(result.message.length).toBeGreaterThan(0)
    })

    it('should classify 400 as network error', () => {
      const result = classifyApiError(400)

      expect(result.type).toBe('network')
    })

    it('should use custom message when provided for 401', () => {
      const result = classifyApiError(401, 'Custom auth message')

      expect(result.message).toBe('Custom auth message')
    })

    it('should use custom message when provided for 404', () => {
      const result = classifyApiError(404, 'Custom not found')

      expect(result.message).toBe('Custom not found')
    })

    it('should use custom message when provided for 500', () => {
      const result = classifyApiError(500, 'Custom server error')

      expect(result.message).toBe('Custom server error')
    })

    it('should use default message when not provided', () => {
      const result = classifyApiError(500)

      expect(result.message).toBeTruthy()
      expect(result.message.length).toBeGreaterThan(0)
    })

    it('should return correct error type for each category', () => {
      expect(classifyApiError(401).type).toBe('unauthorized')
      expect(classifyApiError(404).type).toBe('notFound')
      expect(classifyApiError(500).type).toBe('server')
      expect(classifyApiError(999).type).toBe('network')
    })
  })

  describe('isValidUuid', () => {
    it('should return true for valid UUID v4', () => {
      expect(isValidUuid('123e4567-e89b-12d3-a456-426614174000')).toBe(true)
    })

    it('should return false for invalid format', () => {
      expect(isValidUuid('not-a-uuid')).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isValidUuid(undefined)).toBe(false)
    })

    it('should return false for empty string', () => {
      expect(isValidUuid('')).toBe(false)
    })

    it('should handle uppercase UUIDs', () => {
      expect(isValidUuid('123E4567-E89B-12D3-A456-426614174000')).toBe(true)
    })

    it('should handle lowercase UUIDs', () => {
      expect(isValidUuid('123e4567-e89b-12d3-a456-426614174000')).toBe(true)
    })

    it('should reject UUIDs with wrong segment lengths', () => {
      expect(isValidUuid('123e4567-e89b-12d3-a456-4266141740')).toBe(false) // Too short
      expect(isValidUuid('123e4567-e89b-12d3-a456-42661417400000')).toBe(false) // Too long
    })

    it('should reject non-hex characters', () => {
      expect(isValidUuid('123g4567-e89b-12d3-a456-426614174000')).toBe(false)
      expect(isValidUuid('123e4567-z89b-12d3-a456-426614174000')).toBe(false)
    })

    it('should reject UUID without dashes', () => {
      expect(isValidUuid('123e4567e89b12d3a456426614174000')).toBe(false)
    })

    it('should reject UUID with wrong dash positions', () => {
      expect(isValidUuid('123e-4567e89b-12d3-a456-426614174000')).toBe(false)
    })
  })

  describe('mapToReanalyzePayload', () => {
    const baseViewModel: AnalysisResultViewModel = {
      analysisId: '123e4567-e89b-12d3-a456-426614174000',
      productId: '456e7890-e89b-12d3-a456-426614174000',
      productName: 'Premium Dog Food',
      productUrl: 'https://example.com/product',
      recommendation: 'Recommended',
      justification: 'Great ingredients',
      concerns: [],
      species: 'Dog',
      breed: 'Golden Retriever',
      age: 5,
      additionalInfo: 'Very active',
      ingredientsText: 'Chicken, rice',
      createdAt: '2024-01-01T12:00:00Z',
    }

    it('should map ViewModel to ReanalyzePayload', () => {
      const result = mapToReanalyzePayload(baseViewModel)

      expect(result).toEqual({
        productName: 'Premium Dog Food',
        productUrl: 'https://example.com/product',
        species: 'Dog',
        breed: 'Golden Retriever',
        age: 5,
        additionalInfo: 'Very active',
        ingredientsText: 'Chicken, rice',
      })
    })

    it('should return null if productName missing', () => {
      const vm = { ...baseViewModel, productName: '' }
      const result = mapToReanalyzePayload(vm)

      expect(result).toBeNull()
    })

    it('should return null if productUrl missing', () => {
      const vm = { ...baseViewModel, productUrl: null }
      const result = mapToReanalyzePayload(vm)

      expect(result).toBeNull()
    })

    it('should return null if breed missing', () => {
      const vm = { ...baseViewModel, breed: null }
      const result = mapToReanalyzePayload(vm)

      expect(result).toBeNull()
    })

    it('should return null if age is null', () => {
      const vm = { ...baseViewModel, age: null }
      const result = mapToReanalyzePayload(vm)

      expect(result).toBeNull()
    })

    it('should include additionalInfo when present', () => {
      const result = mapToReanalyzePayload(baseViewModel)

      expect(result?.additionalInfo).toBe('Very active')
    })

    it('should include ingredientsText when present', () => {
      const result = mapToReanalyzePayload(baseViewModel)

      expect(result?.ingredientsText).toBe('Chicken, rice')
    })

    it('should handle undefined additionalInfo', () => {
      const vm = { ...baseViewModel, additionalInfo: null }
      const result = mapToReanalyzePayload(vm)

      expect(result?.additionalInfo).toBeUndefined()
    })

    it('should handle empty string ingredientsText', () => {
      const vm = { ...baseViewModel, ingredientsText: '' }
      const result = mapToReanalyzePayload(vm)

      expect(result?.ingredientsText).toBeUndefined()
    })

    it('should handle null ingredientsText', () => {
      const vm = { ...baseViewModel, ingredientsText: null }
      const result = mapToReanalyzePayload(vm)

      expect(result?.ingredientsText).toBeUndefined()
    })

    it('should preserve species correctly', () => {
      const catVm = { ...baseViewModel, species: 'Cat' as const }
      const result = mapToReanalyzePayload(catVm)

      expect(result?.species).toBe('Cat')
    })

    it('should not include analysisId or productId', () => {
      const result = mapToReanalyzePayload(baseViewModel)

      expect(result).not.toHaveProperty('analysisId')
      expect(result).not.toHaveProperty('productId')
    })

    it('should not include recommendation or justification', () => {
      const result = mapToReanalyzePayload(baseViewModel)

      expect(result).not.toHaveProperty('recommendation')
      expect(result).not.toHaveProperty('justification')
    })
  })

  describe('getRecommendationBadgeClass', () => {
    it('should return green classes for Recommended', () => {
      const result = getRecommendationBadgeClass('Recommended')

      expect(result).toContain('green')
      expect(result).not.toContain('red')
    })

    it('should return red classes for NotRecommended', () => {
      const result = getRecommendationBadgeClass('NotRecommended')

      expect(result).toContain('red')
      expect(result).not.toContain('green')
    })

    it('should include shadow-lg for both', () => {
      expect(getRecommendationBadgeClass('Recommended')).toContain('shadow-lg')
      expect(getRecommendationBadgeClass('NotRecommended')).toContain('shadow-lg')
    })

    it('should include text-white for both', () => {
      expect(getRecommendationBadgeClass('Recommended')).toContain('text-white')
      expect(getRecommendationBadgeClass('NotRecommended')).toContain('text-white')
    })
  })

  describe('getRecommendationLabel', () => {
    it('should return "Recommended" for Recommended', () => {
      expect(getRecommendationLabel('Recommended')).toBe('Recommended')
    })

    it('should return "Not Recommended" for NotRecommended', () => {
      expect(getRecommendationLabel('NotRecommended')).toBe('Not Recommended')
    })
  })
})

