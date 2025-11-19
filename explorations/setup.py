from setuptools import setup, find_packages

setup(
    name='cdtn-explorations',
    version='0.1.1',
    packages=find_packages(where='src'),
    package_dir={"": "src"},
    author='Code du travail numérique',
    install_requires=['elasticsearch==8.8.2',
                      # 'eland==8.3', with elasticsearch 8.3 for explo 7
                      # 'sentence-transformers==2.2.2', for explo 7
                      # 'transformers==4.21', for explo 7
                      # 'sqlalchemy==1.4.53', for explo 7
                      # 'torch==1.12.1', for explo 7
                      # 'unidecode==1.3.8', for explo 7
                      # 'psycopg2-binary==2.9.9', for explo 7
                      # 'requests==2.32.3', for explo 7
                      'ipywidgets==8.1.8',
                      'jupyterlab',
                      'notebook==7.5.0',
                      'pandas==2.2.3',
                      'python-dotenv==1.0.1',
                      'tqdm==4.67.1'
                      ],
    python_requires='>=3.9',
)
