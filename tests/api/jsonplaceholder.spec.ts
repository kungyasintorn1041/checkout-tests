import { test, expect } from '@playwright/test'

// JSONPlaceholder — API ฟรีสำหรับฝึก ไม่ต้องมี server เอง
// https://jsonplaceholder.typicode.com

const BASE_URL = 'https://jsonplaceholder.typicode.com'

// ── GET ─────────────────────────────────────────────────────────────────────

test.describe('GET — ดึงข้อมูล', () => {

  test('TC-A01: GET posts ทั้งหมด → status 200 และได้ครบ 100 posts', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/posts`)

    // ตรวจ status
    expect(response.status()).toBe(200)
    await expect(response).toBeOK()

    // ตรวจ body
    const body = await response.json()
    expect(body).toHaveLength(100)
    expect(body[0]).toHaveProperty('id')
    expect(body[0]).toHaveProperty('title')
    expect(body[0]).toHaveProperty('body')
    expect(body[0]).toHaveProperty('userId')
  })

  test('TC-A02: GET post เดี่ยว → ข้อมูลถูกต้อง', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/posts/1`)

    expect(response.status()).toBe(200)

    const body = await response.json()
    expect(body.id).toBe(1)
    expect(body.userId).toBe(1)
    expect(typeof body.title).toBe('string')
    expect(body.title.length).toBeGreaterThan(0)
  })

  test('TC-A03: GET post ที่ไม่มี → status 404', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/posts/99999`)

    // negative case — ต้องได้ 404
    expect(response.status()).toBe(404)
  })

  test('TC-A04: GET comments ของ post → ได้ comments ที่ถูก post', async ({ request }) => {
    const postId = 1
    const response = await request.get(`${BASE_URL}/posts/${postId}/comments`)

    expect(response.status()).toBe(200)

    const body = await response.json()
    expect(body.length).toBeGreaterThan(0)

    // ทุก comment ต้องเป็นของ postId นี้
    body.forEach((comment: { postId: number; email: string }) => {
      expect(comment.postId).toBe(postId)
      expect(comment.email).toContain('@') // email ต้องมี @
    })
  })

})

// ── POST ─────────────────────────────────────────────────────────────────────

test.describe('POST — สร้างข้อมูล', () => {

  test('TC-A05: POST post ใหม่ → status 201 และ id ถูกสร้าง', async ({ request }) => {
    const newPost = {
      title:  'ทดสอบ API Testing',
      body:   'เนื้อหาของ post ทดสอบ',
      userId: 1
    }

    const response = await request.post(`${BASE_URL}/posts`, {
      data: newPost
    })

    // POST สำเร็จต้องได้ 201 Created ไม่ใช่ 200
    expect(response.status()).toBe(201)

    const body = await response.json()
    expect(body.id).toBeDefined()         // ต้องได้ id กลับมา
    expect(body.title).toBe(newPost.title)
    expect(body.body).toBe(newPost.body)
    expect(body.userId).toBe(newPost.userId)
  })

  test('TC-A06: POST post โดยส่ง Content-Type ถูกต้อง', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/posts`, {
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        title:  'test with header',
        body:   'body content',
        userId: 2
      }
    })

    expect(response.status()).toBe(201)

    // ตรวจ Content-Type ของ response
    const contentType = response.headers()['content-type']
    expect(contentType).toContain('application/json')
  })

})

// ── PUT ──────────────────────────────────────────────────────────────────────

test.describe('PUT — แก้ไขข้อมูล', () => {

  test('TC-A07: PUT แก้ไข post → ข้อมูลอัปเดตสำเร็จ', async ({ request }) => {
    const updatedPost = {
      id:     1,
      title:  'หัวข้อที่แก้ไขแล้ว',
      body:   'เนื้อหาที่แก้ไขแล้ว',
      userId: 1
    }

    const response = await request.put(`${BASE_URL}/posts/1`, {
      data: updatedPost
    })

    expect(response.status()).toBe(200)

    const body = await response.json()
    expect(body.title).toBe(updatedPost.title)
    expect(body.body).toBe(updatedPost.body)
    expect(body.id).toBe(1)
  })

  test('TC-A08: PATCH แก้บางส่วน → เฉพาะ field ที่ส่งเปลี่ยน', async ({ request }) => {
    // PATCH = แก้แค่บางส่วน ต่างจาก PUT ที่แก้ทั้งหมด
    const response = await request.patch(`${BASE_URL}/posts/1`, {
      data: {
        title: 'แก้แค่หัวข้อ'
      }
    })

    expect(response.status()).toBe(200)

    const body = await response.json()
    expect(body.title).toBe('แก้แค่หัวข้อ')
    expect(body.id).toBe(1) // id ต้องยังเป็น 1 เหมือนเดิม
  })

})

// ── DELETE ───────────────────────────────────────────────────────────────────

test.describe('DELETE — ลบข้อมูล', () => {

  test('TC-A09: DELETE post → status 200 และ body ว่าง', async ({ request }) => {
    const response = await request.delete(`${BASE_URL}/posts/1`)

    // DELETE สำเร็จต้องได้ 200
    expect(response.status()).toBe(200)

    // body ต้องว่าง เพราะลบแล้ว
    const body = await response.json()
    expect(body).toEqual({})
  })

  test('TC-A10: DELETE post ที่ไม่มี → status 404', async ({ request }) => {
    const response = await request.delete(`${BASE_URL}/posts/99999`)

    expect(response.status()).toBe(200)
  })

})

// ── Response Headers ──────────────────────────────────────────────────────────

test.describe('Response Headers — ตรวจ header', () => {

  test('TC-A11: ตรวจ headers ของ response', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/posts/1`)

    const headers = response.headers()

    // ต้องมี content-type เป็น JSON
    expect(headers['content-type']).toContain('application/json')
  })

  test('TC-A12: ตรวจ response time — ต้องไม่เกิน 3 วินาที', async ({ request }) => {
    const start = Date.now()

    const response = await request.get(`${BASE_URL}/posts`)

    const duration = Date.now() - start

    expect(response.status()).toBe(200)
    expect(duration).toBeLessThan(3000) // ต้องเร็วกว่า 3 วินาที
  })

})
