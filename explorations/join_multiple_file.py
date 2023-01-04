import pandas as pd
import glob
import os
from dotenv import load_dotenv
load_dotenv()

# Path to monolog
PATH_CDTN_MONOLOG = os.getenv('PATH_CDTN_MONOLOG')


def pd_read_pattern(pattern):
    files = glob.glob(pattern)

    list_of_df = []
    for f in files:
        list_of_df.append(pd.read_csv(f))
    df = pd.concat(list_of_df)
    return df.reset_index(drop=True)

def get_df_from_pattern_and_save_to_csv(pattern, filename='big_file.csv'):
    df = pd_read_pattern(pattern)
    df.to_csv(filename)
    return df
