import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../components/App/App';
import Comment from '../components/comment/comment';

// Canvas and remote services are outside these component integration tests.
vi.mock('react-chartjs-2', () => ({ Line: () => <canvas aria-label="Price chart" /> }));
vi.mock('../api', () => ({ congeckoGetExchangeInfo: vi.fn(() => new Promise(() => {})) }));

describe('restored app with updated UI dependencies', () => {
  it('renders the dashboard and switches cryptocurrency tabs', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    render(<MemoryRouter><App /></MemoryRouter>);
    expect(screen.getByText('Crypto$olution')).toBeTruthy();
    const ethereum = screen.getByRole('tab', { name: 'Ethereum' });
    fireEvent.click(ethereum);
    expect(ethereum.getAttribute('aria-selected')).toBe('true');
    expect((await screen.findAllByRole('status')).length).toBeGreaterThan(0);
  });

  it.each([['/login', 'User Log in'], ['/signup', 'User Sign up']])('renders %s', (path, heading) => {
    render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);
    expect(screen.getByText(heading)).toBeTruthy();
    expect(screen.getByPlaceholderText('Password').type).toBe('password');
  });

  it('handles a missing comments backend without crashing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    render(<Comment />);
    expect((await screen.findByRole('status')).textContent).toContain('backend is not running');
    expect(screen.getByRole('button', { name: 'send' }).disabled).toBe(true);
  });

  it('handles an unsuccessful comments HTTP response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    render(<Comment />);
    expect((await screen.findByRole('status')).textContent).toContain('unavailable');
  });

  it('renders comments returned by the backend', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({
      data: [{ id: 1, username: 'alumnus', comment: 'Hello again', mtime: '2026-09-08' }],
    }) }));
    render(<Comment />);
    expect(await screen.findByText('Hello again')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'send' }).disabled).toBe(false);
  });
});
