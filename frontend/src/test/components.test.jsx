import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, test, expect } from 'vitest';
import TopicInput from '../components/TopicInput';
import VerdictCard from '../components/VerdictCard';
import Navbar from '../components/Navbar';

// Mock react-i18next translation hook
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() }
  })
}));

// Mock useDebate context hook
const mockLogout = vi.fn();
vi.mock('../context/DebateContext', () => ({
  useDebate: () => ({
    token: 'mock-jwt-token-123',
    user: { id: 'usr-1', email: 'user@test.com' },
    logout: mockLogout,
    debateState: 'idle'
  })
}));

describe('Frontend Components Unit Tests', () => {

  test('TopicInput should render correctly and handle submissions', () => {
    const handleSubmit = vi.fn();
    render(<TopicInput onSubmit={handleSubmit} disabled={false} />);

    // Check headings rendering
    expect(screen.getByText('initiate_debate')).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/Enter a topic/i);
    expect(input).toBeInTheDocument();

    // Type topic
    fireEvent.change(input, { target: { value: 'Should robots build robots?' } });
    
    const startButton = screen.getByRole('button', { name: /start_debate/i });
    fireEvent.click(startButton);

    expect(handleSubmit).toHaveBeenCalledWith('Should robots build robots?');
  });

  test('VerdictCard should render score Tallies and reasoning text', () => {
    const mockVerdict = {
      agentA_score: 92,
      agentB_score: 84,
      winner: 'A',
      reasoning: 'Agent A was highly constructive and coherent.'
    };
    const handleReset = vi.fn();

    render(<VerdictCard verdict={mockVerdict} onReset={handleReset} />);

    expect(screen.getByText('verdict_delivered')).toBeInTheDocument();
    expect(screen.getByText(/92\/100/)).toBeInTheDocument();
    expect(screen.getByText(/84\/100/)).toBeInTheDocument();
    expect(screen.getByText(/"Agent A was highly constructive and coherent."/)).toBeInTheDocument();

    const resetBtn = screen.getByRole('button', { name: /start_new_debate/i });
    fireEvent.click(resetBtn);
    expect(handleReset).toHaveBeenCalledTimes(1);
  });

  test('Navbar should render correct navigation targets and reflect login state', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    // Should display links
    expect(screen.getByText('home')).toBeInTheDocument();
    expect(screen.getByText('history')).toBeInTheDocument();
    expect(screen.getByText('analytics')).toBeInTheDocument();
    
    // Auth context shows token is set, so email should be shown
    expect(screen.getByText('user@test.com')).toBeInTheDocument();

    // Logout button should trigger context logout
    const logoutBtn = screen.getByRole('button', { name: /logout/i });
    fireEvent.click(logoutBtn);
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

});
