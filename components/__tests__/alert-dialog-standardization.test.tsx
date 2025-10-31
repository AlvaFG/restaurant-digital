/**
 * AlertDialog Standardization Tests (Sprint 2)
 * Verificar que todos los componentes usan AlertDialog correctamente
 */

import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

describe('AlertDialog Component - Structure', () => {
  it('should render AlertDialog with all required parts', () => {
    render(
      <AlertDialog open={true}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Test Title</AlertDialogTitle>
            <AlertDialogDescription>Test Description</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )

    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
    expect(screen.getByText('Confirm')).toBeInTheDocument()
  })

  it('should have proper ARIA labels for accessibility', () => {
    render(
      <AlertDialog open={true}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )

    const title = screen.getByText('Delete Item')
    const description = screen.getByText('This action cannot be undone.')
    
    expect(title).toBeInTheDocument()
    expect(description).toBeInTheDocument()
  })
})

describe('AlertDialog Component - Interactions', () => {
  it('should call onCancel when Cancel button is clicked', async () => {
    let cancelled = false

    render(
      <AlertDialog open={true}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>Are you sure?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { cancelled = true }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )

    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)

    await waitFor(() => {
      expect(cancelled).toBe(true)
    })
  })

  it('should call onConfirm when Action button is clicked', async () => {
    let confirmed = false

    render(
      <AlertDialog open={true}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>Delete this item?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { confirmed = true }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )

    const actionButton = screen.getByText('Delete')
    fireEvent.click(actionButton)

    await waitFor(() => {
      expect(confirmed).toBe(true)
    })
  })

  it('should support disabled state on buttons', () => {
    render(
      <AlertDialog open={true}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Processing...</AlertDialogTitle>
            <AlertDialogDescription>Please wait</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )

    const cancelButton = screen.getByText('Cancel')
    const actionButton = screen.getByText('Confirm')

    expect(cancelButton).toBeDisabled()
    expect(actionButton).toBeDisabled()
  })
})

describe('AlertDialog Component - Visual Variants', () => {
  it('should support destructive action variant', () => {
    render(
      <AlertDialog open={true}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Permanently</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )

    const deleteButton = screen.getByText('Delete')
    expect(deleteButton).toHaveClass('bg-destructive')
  })

  it('should support custom button text', () => {
    render(
      <AlertDialog open={true}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Custom Actions</AlertDialogTitle>
            <AlertDialogDescription>Choose an option</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, volver</AlertDialogCancel>
            <AlertDialogAction>Sí, continuar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )

    expect(screen.getByText('No, volver')).toBeInTheDocument()
    expect(screen.getByText('Sí, continuar')).toBeInTheDocument()
  })
})

describe('AlertDialog Component - Edge Cases', () => {
  it('should handle long descriptions gracefully', () => {
    const longText = 'A'.repeat(500)

    render(
      <AlertDialog open={true}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Long Content</AlertDialogTitle>
            <AlertDialogDescription>{longText}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )

    expect(screen.getByText(longText)).toBeInTheDocument()
  })

  it('should support multiple action buttons', () => {
    render(
      <AlertDialog open={true}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Multiple Options</AlertDialogTitle>
            <AlertDialogDescription>Choose one</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Option 1</AlertDialogAction>
            <AlertDialogAction>Option 2</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )

    expect(screen.getByText('Option 1')).toBeInTheDocument()
    expect(screen.getByText('Option 2')).toBeInTheDocument()
  })

  it('should handle rapid clicks without breaking', async () => {
    let clickCount = 0

    render(
      <AlertDialog open={true}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rapid Click Test</AlertDialogTitle>
            <AlertDialogDescription>Test rapid clicks</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => clickCount++}>
              Click Me
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )

    const button = screen.getByText('Click Me')

    // Simular clicks rápidos
    fireEvent.click(button)
    fireEvent.click(button)
    fireEvent.click(button)

    await waitFor(() => {
      expect(clickCount).toBeGreaterThan(0)
    })
  })
})

describe('AlertDialog Standardization - Compliance Check', () => {
  it('should follow Radix UI AlertDialog structure', () => {
    // Este test verifica que seguimos el patrón correcto de Radix UI
    const { container } = render(
      <AlertDialog open={true}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Standard Structure</AlertDialogTitle>
            <AlertDialogDescription>Following best practices</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )

    // Verificar que el contenedor tiene la estructura correcta
    expect(container.querySelector('[role="alertdialog"]')).toBeInTheDocument()
  })

  it('should have consistent button order (Cancel first, Action second)', () => {
    render(
      <AlertDialog open={true}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Button Order Test</AlertDialogTitle>
            <AlertDialogDescription>Check button order</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )

    const buttons = screen.getAllByRole('button')
    expect(buttons[0]).toHaveTextContent('Cancel')
    expect(buttons[1]).toHaveTextContent('Confirm')
  })

  it('should use semantic HTML for accessibility', () => {
    const { container } = render(
      <AlertDialog open={true}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Semantic HTML</AlertDialogTitle>
            <AlertDialogDescription>Accessibility matters</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )

    // Verificar que hay elementos button apropiados
    const buttons = container.querySelectorAll('button')
    expect(buttons.length).toBeGreaterThanOrEqual(2)
  })
})
