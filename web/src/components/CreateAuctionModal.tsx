import React from 'react'
import { useForm } from 'react-hook-form'
import staticContracts from '../assets/Static.json'

const getDefaultEndTime = () => {
    // Default to 24 hours from now
    return Date.now() + (24 * 60 * 60 * 1000)
}

interface CreateAuctionModalProps {
    showCreateForm: boolean
    setShowCreateForm: (show: boolean) => void
    createAuction: (auction: {
        title: string
        description: string
        nftContract: string
        nftTokenId: string
        tokenContract: string
        startingBid: string
        endTime: number
        signature?: string
        sigHash?: string
    }) => Promise<any>
}

interface AuctionFormData {
    title: string
    description: string
    nftContract: string
    nftTokenId: string
    tokenContract: string
    startingBid: string
    durationHours: number
}

const CreateAuctionModal: React.FC<CreateAuctionModalProps> = ({
    showCreateForm,
    setShowCreateForm,
    createAuction
}) => {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset
    } = useForm<AuctionFormData>({
        defaultValues: {
            title: 'Test Auction',
            description: 'Testing ERC1155 to ERC20 auction',
            nftContract: staticContracts.exampleNftAddr,
            nftTokenId: '0',
            tokenContract: staticContracts.exampleTokenAddr,
            startingBid: '0.01',
            durationHours: 24
        }
    })

    const onSubmit = async (data: AuctionFormData) => {
        console.log('submitting')
        try {
            // Calculate end time based on duration in hours
            const endTime = Date.now() + (data.durationHours * 60 * 60 * 1000)
            
            const auctionData = {
                title: data.title,
                description: data.description,
                nftContract: data.nftContract,
                nftTokenId: data.nftTokenId,
                tokenContract: data.tokenContract,
                startingBid: data.startingBid,
                endTime
            }

            const result = await createAuction(auctionData)
            
            if (result) {
                console.log('Auction created successfully:', result)
                reset()
                setShowCreateForm(false)
            }
        } catch (error) {
            console.error('Error creating auction:', error)
        }
    }

    const handleClose = () => {
        reset()
        setShowCreateForm(false)
    }

    if (!showCreateForm) {
        return null
    }

    const styles = {
        modalOverlay: {
            position: 'fixed' as const,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        },
        modalContent: {
            background: 'white',
            borderRadius: '8px',
            padding: 0,
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto' as const,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        },
        modalHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 24px',
            borderBottom: '1px solid #e5e7eb'
        },
        modalTitle: {
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: 600,
            color: '#111827'
        },
        closeButton: {
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#6b7280',
            padding: 0,
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        },
        auctionForm: {
            padding: '24px'
        },
        formGroup: {
            marginBottom: '20px'
        },
        label: {
            display: 'block',
            marginBottom: '6px',
            fontWeight: 500,
            color: '#374151'
        },
        input: {
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '14px',
            boxSizing: 'border-box' as const
        },
        inputError: {
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #ef4444',
            borderRadius: '4px',
            fontSize: '14px',
            boxSizing: 'border-box' as const
        },
        textarea: {
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '14px',
            boxSizing: 'border-box' as const,
            resize: 'vertical' as const
        },
        textareaError: {
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #ef4444',
            borderRadius: '4px',
            fontSize: '14px',
            boxSizing: 'border-box' as const,
            resize: 'vertical' as const
        },
        errorMessage: {
            display: 'block',
            color: '#ef4444',
            fontSize: '12px',
            marginTop: '4px'
        },
        formActions: {
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid #e5e7eb'
        },
        cancelButton: {
            padding: '8px 16px',
            borderRadius: '4px',
            fontWeight: 500,
            cursor: 'pointer',
            border: 'none',
            fontSize: '14px',
            backgroundColor: '#f3f4f6',
            color: '#374151'
        },
        submitButton: {
            padding: '8px 16px',
            borderRadius: '4px',
            fontWeight: 500,
            cursor: 'pointer',
            border: 'none',
            fontSize: '14px',
            backgroundColor: '#3b82f6',
            color: 'white'
        },
        disabledButton: {
            opacity: 0.5,
            cursor: 'not-allowed'
        }
    }

    return (
        <div style={styles.modalOverlay} onClick={handleClose}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div style={styles.modalHeader}>
                    <h2 style={styles.modalTitle}>Create New Auction</h2>
                    <button 
                        type="button" 
                        style={styles.closeButton}
                        onClick={handleClose}
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} style={styles.auctionForm}>
                    <div style={styles.formGroup}>
                        <label htmlFor="title" style={styles.label}>Title *</label>
                        <input
                            id="title"
                            type="text"
                            {...register('title', {
                                required: 'Title is required',
                                minLength: {
                                    value: 3,
                                    message: 'Title must be at least 3 characters'
                                }
                            })}
                            style={errors.title ? styles.inputError : styles.input}
                        />
                        {errors.title && (
                            <span style={styles.errorMessage}>{errors.title.message}</span>
                        )}
                    </div>

                    <div style={styles.formGroup}>
                        <label htmlFor="description" style={styles.label}>Description *</label>
                        <textarea
                            id="description"
                            rows={3}
                            {...register('description', {
                                required: 'Description is required',
                                minLength: {
                                    value: 10,
                                    message: 'Description must be at least 10 characters'
                                }
                            })}
                            style={errors.description ? styles.textareaError : styles.textarea}
                        />
                        {errors.description && (
                            <span style={styles.errorMessage}>{errors.description.message}</span>
                        )}
                    </div>

                    <div style={styles.formGroup}>
                        <label htmlFor="nftContract" style={styles.label}>NFT Contract Address *</label>
                        <input
                            id="nftContract"
                            type="text"
                            placeholder="0x..."
                            {...register('nftContract', {
                                required: 'NFT contract address is required',
                                pattern: {
                                    value: /^0x[a-fA-F0-9]{40}$/,
                                    message: 'Invalid Ethereum address format'
                                }
                            })}
                            style={errors.nftContract ? styles.inputError : styles.input}
                        />
                        {errors.nftContract && (
                            <span style={styles.errorMessage}>{errors.nftContract.message}</span>
                        )}
                    </div>

                    <div style={styles.formGroup}>
                        <label htmlFor="nftTokenId" style={styles.label}>NFT Token ID *</label>
                        <input
                            id="nftTokenId"
                            type="text"
                            {...register('nftTokenId', {
                                required: 'NFT token ID is required',
                                pattern: {
                                    value: /^\d+$/,
                                    message: 'Token ID must be a number'
                                }
                            })}
                            style={errors.nftTokenId ? styles.inputError : styles.input}
                        />
                        {errors.nftTokenId && (
                            <span style={styles.errorMessage}>{errors.nftTokenId.message}</span>
                        )}
                    </div>

                    <div style={styles.formGroup}>
                        <label htmlFor="tokenContract" style={styles.label}>Token Contract Address *</label>
                        <input
                            id="tokenContract"
                            type="text"
                            placeholder="0x... (ERC-20 token for bidding)"
                            {...register('tokenContract', {
                                required: 'Token contract address is required',
                                pattern: {
                                    value: /^0x[a-fA-F0-9]{40}$/,
                                    message: 'Invalid Ethereum address format'
                                }
                            })}
                            style={errors.tokenContract ? styles.inputError : styles.input}
                        />
                        {errors.tokenContract && (
                            <span style={styles.errorMessage}>{errors.tokenContract.message}</span>
                        )}
                    </div>

                    <div style={styles.formGroup}>
                        <label htmlFor="startingBid" style={styles.label}>Starting Bid *</label>
                        <input
                            id="startingBid"
                            type="text"
                            placeholder="0.1"
                            {...register('startingBid', {
                                required: 'Starting bid is required',
                                pattern: {
                                    value: /^\d*\.?\d+$/,
                                    message: 'Starting bid must be a valid number'
                                },
                                validate: (value) => {
                                    const num = parseFloat(value)
                                    return num > 0 || 'Starting bid must be greater than 0'
                                }
                            })}
                            style={errors.startingBid ? styles.inputError : styles.input}
                        />
                        {errors.startingBid && (
                            <span style={styles.errorMessage}>{errors.startingBid.message}</span>
                        )}
                    </div>

                    <div style={styles.formGroup}>
                        <label htmlFor="durationHours" style={styles.label}>Duration (hours) *</label>
                        <input
                            id="durationHours"
                            type="number"
                            min="1"
                            max="168"
                            {...register('durationHours', {
                                required: 'Duration is required',
                                min: {
                                    value: 1,
                                    message: 'Duration must be at least 1 hour'
                                },
                                max: {
                                    value: 168,
                                    message: 'Duration cannot exceed 168 hours (7 days)'
                                }
                            })}
                            style={errors.durationHours ? styles.inputError : styles.input}
                        />
                        {errors.durationHours && (
                            <span style={styles.errorMessage}>{errors.durationHours.message}</span>
                        )}
                    </div>

                    <div style={styles.formActions}>
                        <button
                            type="button"
                            onClick={handleClose}
                            style={{
                                ...styles.cancelButton,
                                ...(isSubmitting ? styles.disabledButton : {})
                            }}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            style={{
                                ...styles.submitButton,
                                ...(isSubmitting ? styles.disabledButton : {})
                            }}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Creating...' : 'Create Auction'}
                        </button>
                    </div>
                </form>
            </div>


        </div>
    )
}

export default CreateAuctionModal