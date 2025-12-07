import React from 'react';

/**
 * Syntax highlighter for libusdr CLI commands
 * Color-codes different parts of the command for better readability
 */
export function highlightLibusdrCommand(command: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let currentIndex = 0;
  
  // Regular expressions for different syntax elements
  const patterns = [
    { regex: /usdr_dm_create|usdr_\w+/g, color: '#9333ea', label: 'command' }, // Purple for command
    { regex: /-[a-zA-Z]\b/g, color: '#3b82f6', label: 'flag' }, // Blue for flags
    { regex: /\b\d+(?:\.\d+)?(?:[kKmMgG](?:Hz)?|s|ms)?\b/g, color: '#10b981', label: 'value' }, // Green for numbers/values
    { regex: /"[^"]*"/g, color: '#f59e0b', label: 'string' }, // Orange for strings
    { regex: /\/dev\/\S+/g, color: '#ec4899', label: 'path' }, // Pink for device paths
  ];
  
  const tokens: Array<{ start: number; end: number; color: string; text: string }> = [];
  
  // Find all matches
  patterns.forEach(({ regex, color }) => {
    const matches = Array.from(command.matchAll(regex));
    for (const match of matches) {
      if (match.index !== undefined) {
        tokens.push({
          start: match.index,
          end: match.index + match[0].length,
          color,
          text: match[0],
        });
      }
    }
  });
  
  // Sort tokens by position
  tokens.sort((a, b) => a.start - b.start);
  
  // Build highlighted output
  tokens.forEach((token, index) => {
    // Add plain text before this token
    if (token.start > currentIndex) {
      parts.push(
        <span key={`plain-${index}`} style={{ color: 'var(--dd-text-primary)' }}>
          {command.substring(currentIndex, token.start)}
        </span>
      );
    }
    
    // Add highlighted token
    parts.push(
      <span key={`token-${index}`} style={{ color: token.color, fontWeight: 500 }}>
        {token.text}
      </span>
    );
    
    currentIndex = token.end;
  });
  
  // Add remaining plain text
  if (currentIndex < command.length) {
    parts.push(
      <span key="plain-end" style={{ color: 'var(--dd-text-primary)' }}>
        {command.substring(currentIndex)}
      </span>
    );
  }
  
  return <>{parts}</>;
}

/**
 * Syntax highlighter for SoapySDR C++ code
 * Color-codes C++ syntax elements
 */
export function highlightSoapySDRCode(code: string): React.ReactNode {
  const lines = code.split('\n');
  
  return (
    <>
      {lines.map((line, lineIndex) => {
        const parts: React.ReactNode[] = [];
        let currentIndex = 0;
        
        // C++ syntax patterns
        const patterns = [
          { regex: /\b(SoapySDR|Device|Stream|make|setupStream|activateStream|setFrequency|setSampleRate|setGain|setBandwidth|setAntenna)\b/g, color: '#3b82f6', label: 'class' }, // Blue for classes/methods
          { regex: /\b(auto|const|void|int|double|size_t|std::string|std::vector)\b/g, color: '#9333ea', label: 'keyword' }, // Purple for keywords
          { regex: /"[^"]*"/g, color: '#10b981', label: 'string' }, // Green for strings
          { regex: /\b\d+(?:\.\d+)?(?:e[+-]?\d+)?[fFuUlL]?\b/g, color: '#f59e0b', label: 'number' }, // Orange for numbers
          { regex: /\/\/.*$/g, color: '#6b7280', label: 'comment' }, // Gray for comments
          { regex: /::|->|\./g, color: '#ec4899', label: 'operator' }, // Pink for operators
        ];
        
        const tokens: Array<{ start: number; end: number; color: string; text: string }> = [];
        
        // Find all matches in this line
        patterns.forEach(({ regex, color }) => {
          const matches = Array.from(line.matchAll(regex));
          for (const match of matches) {
            if (match.index !== undefined) {
              tokens.push({
                start: match.index,
                end: match.index + match[0].length,
                color,
                text: match[0],
              });
            }
          }
        });
        
        // Sort tokens by position
        tokens.sort((a, b) => a.start - b.start);
        
        // Build highlighted line
        tokens.forEach((token, index) => {
          // Add plain text before this token
          if (token.start > currentIndex) {
            parts.push(
              <span key={`plain-${lineIndex}-${index}`} style={{ color: 'var(--dd-text-primary)' }}>
                {line.substring(currentIndex, token.start)}
              </span>
            );
          }
          
          // Add highlighted token
          parts.push(
            <span key={`token-${lineIndex}-${index}`} style={{ color: token.color, fontWeight: token.color === '#6b7280' ? 400 : 500 }}>
              {token.text}
            </span>
          );
          
          currentIndex = token.end;
        });
        
        // Add remaining plain text
        if (currentIndex < line.length) {
          parts.push(
            <span key={`plain-end-${lineIndex}`} style={{ color: 'var(--dd-text-primary)' }}>
              {line.substring(currentIndex)}
            </span>
          );
        }
        
        return (
          <div key={lineIndex}>
            {parts.length > 0 ? parts : <span style={{ color: 'var(--dd-text-primary)' }}>{line}</span>}
          </div>
        );
      })}
    </>
  );
}

/**
 * Main syntax highlighter that detects API type and applies appropriate highlighting
 */
export function highlightCommand(command: string, apiType: 'libusdr' | 'soapysdr' = 'libusdr'): React.ReactNode {
  if (apiType === 'soapysdr') {
    return highlightSoapySDRCode(command);
  }
  return highlightLibusdrCommand(command);
}
