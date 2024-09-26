from setuptools import setup, find_packages

setup(
    name='cdtn-explorations',
    version='0.1.1',
    packages=find_packages(where='src'),
    package_dir={"": "src"},
    author='Code du travail numérique',
    install_requires=['elasticsearch==7.17.9',
                      # 'eland==8.3', with elasticsearch 8.3 for explo 7
                      'ipywidgets==8.0.7',
                      'jupyterlab',
                      'notebook==6.0.3',
                      'pandas==1.5.3',
                      'plotly-express==0.4.1',
                      'psycopg2-binary==2.9.9',
                      'python-dotenv==0.20',
                      'requests==2.32.2',
                      'sentence-transformers==2.2.2',
                      'sqlalchemy==1.4.53',
                      'torch==1.12.1',
                      'transformers==4.21',
                      'tqdm==4.64',
                      'unidecode==1.3.8'],
    python_requires='>=3.9',
)
