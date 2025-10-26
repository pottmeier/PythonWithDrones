# PythonWithDrones
This concept was developed as part of a student project for the "Software Design" module.

# Build locally
Setup Python venv
```
python -m venv .venv
```

activate the venv
```
.venv/Scripts/activate

#or

. .venv/bin/activate.fish
```

install setuptools
```
pip install setuptools
```

install our python package
```
pip install -e .
```

test the functions
```
pytest
```

all tests need to be declared under tests/test_*.py or tests/*_test.py
look into [pytest-docu](https://docs.pytest.org/en/stable/index.html) for more details
