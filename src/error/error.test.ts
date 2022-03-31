import type { Request, Response } from 'express'
import AppError from '@error/errorApp'
import errorHandler from '@error/errorHandler'

const mockReq: Partial<Request> = { originalUrl: '/api/v1' }
let mockRes: Partial<Response> = {}
let responseObject = { message: '', status: 0 }

const mockResponse = (mock: 'status' | 'message'): jest.Mock<Response> => jest.fn().mockImplementationOnce((result: number | string): Partial<Response> => {
  responseObject = { ...responseObject, [mock]: result }
  return mockRes
})

const mockError = (message: string, status: number): Response => errorHandler(new AppError(message, status), mockReq as Request, mockRes as Response)
console.log(process.env['REDIS_URL'])
describe('ERROR TESTS', () => {
  beforeEach(() => {
    mockRes = {
      status: mockResponse('status'),
      send: mockResponse('message')
    }
  })

  describe('Environment Production', () => {
    beforeAll(() => {
      process.env['NODE_ENV'] = 'production'
    })
    test('should return only status 500 and message "Something went wrong" if NODE_ENV is "production"', async () => {
      mockError('Im in production but I want to see detailed error information', 400)

      const { message, status } = responseObject
      expect(process.env['NODE_ENV']).toBe('production')
      expect(status).toBe(500)
      expect(message).toHaveProperty('message', 'Something went wrong')
      expect(message).not.toHaveProperty('status')
      expect(message).not.toHaveProperty('stack')
      expect(message).not.toHaveProperty('error')
    })
    afterAll(() => {
      process.env['NODE_ENV'] = 'test'
    })
  })
  describe('Environment Test/Development', () => {
    test('should return status 400 and detailed information error', () => {
      mockError('I can see detailed information errors', 400)

      const { status, message } = responseObject
      expect(status).toBe(400)
      expect(message).toHaveProperty('message', 'I can see detailed information errors')
      expect(message).toHaveProperty('status', 'failure')
      expect(message).toHaveProperty('stack')
      expect(message).toHaveProperty('error')
    })
  })
})
