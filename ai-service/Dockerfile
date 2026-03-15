# 1. Use a box that has Python installed
FROM python:3.10-slim

# 2. Set the working folder
WORKDIR /app

# 3. Copy the 'shopping list' and install libraries
# Note: We create a requirements.txt file in the next sub-step!
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. Copy the Python code
COPY . .

# 5. Run the brain
CMD ["python", "main.py"]