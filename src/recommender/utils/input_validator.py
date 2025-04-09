"""
Input validation utilities for the recommender system.
These functions help ensure user inputs are in the correct format.
"""

def get_validated_integer(prompt, min_value, max_value, error_message=None):
    """
    Get a validated integer input from the user within a specific range.
    
    Args:
        prompt (str): The prompt to display to the user
        min_value (int): The minimum allowed value (inclusive)
        max_value (int): The maximum allowed value (inclusive)
        error_message (str, optional): Custom error message to display
        
    Returns:
        int: The validated integer input
    """
    if error_message is None:
        error_message = f"Please enter a number between {min_value} and {max_value}."
    
    while True:
        try:
            user_input = input(prompt).strip()
            # Handle empty input
            if not user_input:
                print("Input cannot be empty. " + error_message)
                continue
                
            value = int(user_input)
            if min_value <= value <= max_value:
                return value
            else:
                print(error_message)
        except ValueError:
            print(f"Invalid input. {error_message}")

def get_validated_string(prompt, min_length=1, max_length=None, required=True, error_message=None):
    """
    Get a validated string input from the user.
    
    Args:
        prompt (str): The prompt to display to the user
        min_length (int): The minimum allowed length
        max_length (int, optional): The maximum allowed length
        required (bool): Whether the input is required
        error_message (str, optional): Custom error message to display
        
    Returns:
        str: The validated string input
    """
    if error_message is None:
        if max_length:
            error_message = f"Please enter a text between {min_length} and {max_length} characters."
        else:
            error_message = f"Please enter at least {min_length} character(s)."
    
    while True:
        user_input = input(prompt).strip()
        
        # If input is not required and user entered nothing, return empty string
        if not required and not user_input:
            return ""
            
        # Check length constraints
        if len(user_input) < min_length:
            print(f"Input too short. {error_message}")
        elif max_length and len(user_input) > max_length:
            print(f"Input too long. {error_message}")
        else:
            return user_input

def get_validated_list(prompt, delimiter=',', min_items=1, required=True, error_message=None):
    """
    Get a validated list of items from the user.
    
    Args:
        prompt (str): The prompt to display to the user
        delimiter (str): The character that separates items
        min_items (int): The minimum number of items required
        required (bool): Whether the input is required
        error_message (str, optional): Custom error message to display
        
    Returns:
        list: The validated list of items
    """
    if error_message is None:
        error_message = f"Please enter at least {min_items} item(s), separated by '{delimiter}'."
    
    while True:
        user_input = input(prompt).strip()
        
        # If input is not required and user entered nothing, return empty list
        if not required and not user_input:
            return []
            
        # Split input by delimiter and clean each item
        items = [item.strip() for item in user_input.split(delimiter) if item.strip()]
        
        if len(items) < min_items:
            print(f"Not enough items. {error_message}")
        else:
            return items

def get_validated_yes_no(prompt, default=None, error_message=None):
    """
    Get a validated yes/no response from the user.
    
    Args:
        prompt (str): The prompt to display to the user
        default (str, optional): Default response if user enters nothing ('y' or 'n')
        error_message (str, optional): Custom error message to display
        
    Returns:
        bool: True for yes, False for no
    """
    if error_message is None:
        error_message = "Please enter 'y' or 'n'."
    
    # Add default option to prompt if provided
    if default:
        if default.lower() == 'y':
            prompt += " [Y/n]: "
        elif default.lower() == 'n':
            prompt += " [y/N]: "
    else:
        prompt += " (y/n): "
    
    while True:
        user_input = input(prompt).strip().lower()
        
        # Handle default value
        if not user_input and default:
            return default.lower() == 'y'
            
        if user_input in ['y', 'yes']:
            return True
        elif user_input in ['n', 'no']:
            return False
        else:
            print(error_message) 