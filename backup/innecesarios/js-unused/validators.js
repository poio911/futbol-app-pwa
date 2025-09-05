/**
 * Sistema de Validación para Fútbol Stats
 * Validaciones centralizadas para todos los formularios
 */

class FormValidator {
    /**
     * Validar nombre de jugador
     */
    static validatePlayerName(name, existingPlayers = []) {
        // Verificar que existe
        if (!name || name.trim().length === 0) {
            return { 
                valid: false, 
                message: 'El nombre es obligatorio',
                field: 'player-name'
            };
        }

        // Verificar longitud mínima
        if (name.trim().length < 3) {
            return { 
                valid: false, 
                message: 'El nombre debe tener al menos 3 caracteres',
                field: 'player-name'
            };
        }

        // Verificar longitud máxima
        if (name.trim().length > 50) {
            return { 
                valid: false, 
                message: 'El nombre no puede tener más de 50 caracteres',
                field: 'player-name'
            };
        }

        // Verificar caracteres válidos
        const validNamePattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\.]+$/;
        if (!validNamePattern.test(name)) {
            return { 
                valid: false, 
                message: 'El nombre solo puede contener letras, espacios y guiones',
                field: 'player-name'
            };
        }

        // Verificar duplicados
        const normalizedName = name.trim().toLowerCase();
        const isDuplicate = existingPlayers.some(player => 
            player.name.trim().toLowerCase() === normalizedName
        );
        
        if (isDuplicate) {
            return { 
                valid: false, 
                message: 'Ya existe un jugador con ese nombre',
                field: 'player-name'
            };
        }

        return { valid: true };
    }

    /**
     * Validar posición del jugador
     */
    static validatePosition(position) {
        const validPositions = ['POR', 'DEF', 'MED', 'DEL'];
        
        if (!position) {
            return { 
                valid: false, 
                message: 'Debes seleccionar una posición',
                field: 'player-position'
            };
        }

        if (!validPositions.includes(position)) {
            return { 
                valid: false, 
                message: 'Posición inválida',
                field: 'player-position'
            };
        }

        return { valid: true };
    }

    /**
     * Validar atributos del jugador
     */
    static validatePlayerAttributes(attributes) {
        const requiredAttributes = ['pac', 'sho', 'pas', 'dri', 'def', 'phy'];
        
        for (const attr of requiredAttributes) {
            if (!attributes[attr] && attributes[attr] !== 0) {
                return { 
                    valid: false, 
                    message: `El atributo ${attr.toUpperCase()} es obligatorio`,
                    field: attr
                };
            }

            const value = parseInt(attributes[attr]);
            if (isNaN(value) || value < 1 || value > 99) {
                return { 
                    valid: false, 
                    message: `El atributo ${attr.toUpperCase()} debe estar entre 1 y 99`,
                    field: attr
                };
            }
        }

        return { valid: true };
    }

    /**
     * Validar email
     */
    static validateEmail(email, required = false) {
        if (!email && !required) {
            return { valid: true };
        }

        if (!email && required) {
            return { 
                valid: false, 
                message: 'El email es obligatorio',
                field: 'email'
            };
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            return { 
                valid: false, 
                message: 'El formato del email no es válido',
                field: 'email'
            };
        }

        if (email.length > 100) {
            return { 
                valid: false, 
                message: 'El email es demasiado largo',
                field: 'email'
            };
        }

        return { valid: true };
    }

    /**
     * Validar teléfono
     */
    static validatePhone(phone, required = false) {
        if (!phone && !required) {
            return { valid: true };
        }

        if (!phone && required) {
            return { 
                valid: false, 
                message: 'El teléfono es obligatorio',
                field: 'phone'
            };
        }

        // Permitir varios formatos de teléfono
        const phonePattern = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
        if (!phonePattern.test(phone)) {
            return { 
                valid: false, 
                message: 'El formato del teléfono no es válido',
                field: 'phone'
            };
        }

        return { valid: true };
    }

    /**
     * Validar nombre de grupo
     */
    static validateGroupName(name, existingGroups = []) {
        if (!name || name.trim().length === 0) {
            return { 
                valid: false, 
                message: 'El nombre del grupo es obligatorio',
                field: 'group-name'
            };
        }

        if (name.trim().length < 3) {
            return { 
                valid: false, 
                message: 'El nombre debe tener al menos 3 caracteres',
                field: 'group-name'
            };
        }

        if (name.trim().length > 50) {
            return { 
                valid: false, 
                message: 'El nombre no puede tener más de 50 caracteres',
                field: 'group-name'
            };
        }

        // Verificar duplicados
        const isDuplicate = existingGroups.some(group => 
            group.name.trim().toLowerCase() === name.trim().toLowerCase()
        );
        
        if (isDuplicate) {
            return { 
                valid: false, 
                message: 'Ya existe un grupo con ese nombre',
                field: 'group-name'
            };
        }

        return { valid: true };
    }

    /**
     * Validar formulario de persona
     */
    static validatePersonForm(data, existingPersons = []) {
        // Validar nombre
        if (!data.name || data.name.trim().length === 0) {
            return { 
                valid: false, 
                message: 'El nombre es obligatorio',
                field: 'person-name'
            };
        }

        if (data.name.trim().length < 2) {
            return { 
                valid: false, 
                message: 'El nombre debe tener al menos 2 caracteres',
                field: 'person-name'
            };
        }

        // Validar email
        const emailValidation = this.validateEmail(data.email, true);
        if (!emailValidation.valid) {
            return emailValidation;
        }

        // Verificar email duplicado
        const isDuplicateEmail = existingPersons.some(person => 
            person.email.toLowerCase() === data.email.toLowerCase()
        );
        
        if (isDuplicateEmail) {
            return { 
                valid: false, 
                message: 'Ya existe una cuenta con ese email',
                field: 'email'
            };
        }

        // Validar teléfono si se proporciona
        if (data.phone) {
            const phoneValidation = this.validatePhone(data.phone, false);
            if (!phoneValidation.valid) {
                return phoneValidation;
            }
        }

        return { valid: true };
    }

    /**
     * Validar marcador de partido
     */
    static validateMatchScore(scoreA, scoreB) {
        if (scoreA === undefined || scoreA === null || scoreA === '') {
            return { 
                valid: false, 
                message: 'Debes ingresar el marcador del Equipo A',
                field: 'score-a'
            };
        }

        if (scoreB === undefined || scoreB === null || scoreB === '') {
            return { 
                valid: false, 
                message: 'Debes ingresar el marcador del Equipo B',
                field: 'score-b'
            };
        }

        const numScoreA = parseInt(scoreA);
        const numScoreB = parseInt(scoreB);

        if (isNaN(numScoreA) || numScoreA < 0) {
            return { 
                valid: false, 
                message: 'El marcador del Equipo A debe ser un número válido',
                field: 'score-a'
            };
        }

        if (isNaN(numScoreB) || numScoreB < 0) {
            return { 
                valid: false, 
                message: 'El marcador del Equipo B debe ser un número válido',
                field: 'score-b'
            };
        }

        if (numScoreA > 99 || numScoreB > 99) {
            return { 
                valid: false, 
                message: 'El marcador no puede ser mayor a 99',
                field: numScoreA > 99 ? 'score-a' : 'score-b'
            };
        }

        return { valid: true };
    }

    /**
     * Validar evaluación de jugador
     */
    static validatePlayerEvaluation(evaluation) {
        if (!evaluation.rating) {
            return { 
                valid: false, 
                message: 'Debes asignar una calificación a cada jugador'
            };
        }

        const rating = parseFloat(evaluation.rating);
        if (isNaN(rating) || rating < 1 || rating > 10) {
            return { 
                valid: false, 
                message: 'La calificación debe estar entre 1 y 10'
            };
        }

        // Al menos un tag es recomendado pero no obligatorio
        if (!evaluation.tags || evaluation.tags.length === 0) {
            console.warn('No se seleccionaron tags para el jugador');
        }

        return { valid: true };
    }

    /**
     * Mostrar error en el campo
     */
    static showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (!field) return;

        // Agregar clase de error
        field.classList.add('error');
        
        // Crear o actualizar mensaje de error
        let errorElement = field.parentElement.querySelector('.field-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'field-error';
            field.parentElement.appendChild(errorElement);
        }
        errorElement.textContent = message;
        
        // Focus en el campo con error
        field.focus();
        
        // Remover error al escribir
        field.addEventListener('input', function() {
            field.classList.remove('error');
            if (errorElement) {
                errorElement.remove();
            }
        }, { once: true });
    }

    /**
     * Limpiar todos los errores del formulario
     */
    static clearFormErrors(formId) {
        const form = document.getElementById(formId);
        if (!form) return;

        // Remover clases de error
        form.querySelectorAll('.error').forEach(element => {
            element.classList.remove('error');
        });

        // Remover mensajes de error
        form.querySelectorAll('.field-error').forEach(element => {
            element.remove();
        });
    }

    /**
     * Validar formulario completo
     */
    static validateForm(formId, validations) {
        let isValid = true;
        const errors = [];

        // Limpiar errores previos
        this.clearFormErrors(formId);

        // Ejecutar cada validación
        for (const validation of validations) {
            const result = validation();
            if (!result.valid) {
                isValid = false;
                errors.push(result);
                
                // Mostrar error en el campo
                if (result.field) {
                    this.showFieldError(result.field, result.message);
                }
            }
        }

        return { valid: isValid, errors };
    }
}

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FormValidator;
}