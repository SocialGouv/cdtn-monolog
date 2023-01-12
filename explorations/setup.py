from setuptools import setup, find_packages

setup(
    name='cdtn-explorations',
    version='0.1.1',
    packages=find_packages(where='src'),
    package_dir={"": "src"},
    author='OCTO Technology',
    install_requires=['elasticsearch==7.17',
                      #'eland==8.3', with elasticsearch 8.3 for explo 7
                      'ipywidgets==8.0.4',
                      'jupyterlab',
                      'notebook==6.4.12',
                      'pandas==1.5',
                      'plotly-express==0.4',
                      'psycopg2-binary==2.9',
                      'python-dotenv==0.20',
                      'requests==2.28',
                      'sentence-transformers==2.2',
                      'sqlalchemy==1.4',
                      'torch==1.12.1',
                      'transformers==4.21',
                      'tqdm==4.64',
                      'unidecode==1.3.4'],
    python_requires='>=3.9',
)
